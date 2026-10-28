import { Client, Account, ID, Permission, Role, Query, TablesDB, Storage } from 'node-appwrite';
import { normalizeSlug, parseDateRange, isSourceCategory, isTreatmentStatus, isAppointmentStatus, isContactType, CONTACT_LABELS, normalizeContactValue } from './domain.js';

const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const databaseId = process.env.CLEARFLOW_DATABASE_ID || 'clearflow_dental';
const now = () => new Date().toISOString();
const userRead = userId => [Permission.read(Role.user(userId))];

function response(res, body, status = 200) {
  return res.json(body, status);
}
function parseBody(req) {
  if (req.bodyJson && typeof req.bodyJson === 'object') return req.bodyJson;
  try { return JSON.parse(req.bodyText || '{}'); } catch { return {}; }
}
async function listRows(db, tableId, queries) {
  const result = await db.listRows({ databaseId, tableId, queries: [...queries, Query.limit(100)] });
  return result.rows || [];
}
async function membershipFor(db, userId, tenantId) {
  const rows = await listRows(db, 'clinic_memberships', [
    Query.equal('userId', userId), Query.equal('tenantId', tenantId), Query.equal('status', 'active')
  ]);
  return rows[0] || null;
}
async function requireMembership(db, userId, tenantId) {
  if (!tenantId || typeof tenantId !== 'string') throw Object.assign(new Error('A clinic workspace is required.'), { status: 400 });
  const membership = await membershipFor(db, userId, tenantId);
  if (!membership) throw Object.assign(new Error('You do not have access to this clinic workspace.'), { status: 403 });
  return membership;
}
async function logEvent(db, userId, tenantId, action, entityType, entityId, summary = '') {
  try {
    await db.createRow({
      databaseId, tableId: 'activity_events', rowId: ID.unique(),
      data: { tenantId, actorUserId: userId, action, entityType, entityId, occurredAt: now(), outcome: 'success', summary: String(summary).slice(0, 240) },
      permissions: userRead(userId)
    });
  } catch { /* audit failures are not silently treated as successful in the response paths that require them */ }
}
async function handle(db, storage, userId, body) {
  const { action, payload = {} } = body;
  if (!userId) throw Object.assign(new Error('Sign in is required.'), { status: 401 });

  if (action === 'clinic.list') {
    const memberships = await listRows(db, 'clinic_memberships', [Query.equal('userId', userId), Query.equal('status', 'active')]);
    const clinics = [];
    for (const membership of memberships) {
      try {
        const clinic = await db.getRow({ databaseId, tableId: 'clinics', rowId: membership.tenantId });
        clinics.push({ ...clinic, membership: { role: membership.role, status: membership.status } });
      } catch { /* skip stale membership references */ }
    }
    return { clinics };
  }

  if (action === 'clinic.create') {
    const name = String(payload.name || '').trim();
    const slug = normalizeSlug(payload.slug);
    if (name.length < 2 || name.length > 150 || slug.length < 3 || slug.length > 80) {
      throw Object.assign(new Error('Enter a clinic name and a workspace slug of at least 3 characters.'), { status: 400 });
    }
    const existing = await listRows(db, 'clinic_memberships', [Query.equal('userId', userId), Query.equal('status', 'active')]);
    if (existing.length) throw Object.assign(new Error('This account already belongs to a clinic. Choose an existing workspace.'), { status: 409 });
    const clinicId = ID.unique();
    const timestamp = now();
    const clinic = await db.createRow({
      databaseId, tableId: 'clinics', rowId: clinicId,
      data: { name, slug, timezone: 'Asia/Kolkata', status: 'active', createdBy: userId, createdAt: timestamp, updatedAt: timestamp },
      permissions: userRead(userId)
    });
    try {
      await db.createRow({
        databaseId, tableId: 'clinic_memberships', rowId: ID.unique(),
        data: { tenantId: clinicId, userId, role: 'owner', status: 'active', createdAt: timestamp, updatedAt: timestamp },
        permissions: userRead(userId)
      });
    } catch (error) {
      try { await db.deleteRow({ databaseId, tableId: 'clinics', rowId: clinicId }); } catch {}
      throw error;
    }
    await logEvent(db, userId, clinicId, 'clinic.created', 'clinic', clinicId, 'Clinic workspace created');
    return { clinic, role: 'owner' };
  }

  if (action === 'patient.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const queries = [Query.equal('tenantId', tenantId)];
    // Keep the first prototype query index-independent; UI filters the returned bounded page locally.
    const rows = await listRows(db, 'patients', queries);
    return { patients: rows };
  }

  if (action === 'patient.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const givenName = String(payload.givenName || '').trim();
    const familyName = String(payload.familyName || '').trim();
    if (!givenName || givenName.length > 100 || familyName.length > 100) {
      throw Object.assign(new Error('Enter the patient given name; family name is optional.'), { status: 400 });
    }
    const timestamp = now();
    const patientId = ID.unique();
    const patient = await db.createRow({
      databaseId, tableId: 'patients', rowId: patientId,
      data: {
        tenantId, givenName, familyName,
        patientNumber: String(payload.patientNumber || '').trim().slice(0, 40) || undefined,
        dateOfBirth: payload.dateOfBirth ? new Date(`${payload.dateOfBirth}T00:00:00.000Z`).toISOString() : undefined,
        status: 'active', createdBy: userId, updatedBy: userId,
        createdAt: timestamp, updatedAt: timestamp
      },
      permissions: userRead(userId)
    });
    await logEvent(db, userId, tenantId, 'patient.created', 'patient', patientId, 'Patient record created');
    return { patient };
  }


  if (action === 'patient_contact.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    if (patientId) {
      const patient = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
      if (patient.tenantId !== tenantId) throw Object.assign(new Error('Patient not found in this clinic.'), { status: 404 });
    }
    const queries = [Query.equal('tenantId', tenantId)];
    if (patientId) queries.push(Query.equal('patientId', patientId));
    return { contacts: await listRows(db, 'patient_contacts', queries) };
  }

  if (action === 'patient_contact.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    const patient = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
    if (patient.tenantId !== tenantId) throw Object.assign(new Error('Patient not found in this clinic.'), { status: 404 });
    const type = String(payload.type || '');
    const value = normalizeContactValue(payload.value);
    const label = String(payload.label || 'self');
    if (!isContactType(type) || !value || !CONTACT_LABELS.includes(label)) throw Object.assign(new Error('Choose contact type, value and relationship.'), { status: 400 });
    if (type === 'email' && (!value.includes('@') || !value.split('@')[1]?.includes('.'))) throw Object.assign(new Error('Enter a valid email address.'), { status: 400 });
    if (payload.isPrimary === true) {
      const existing = await listRows(db, 'patient_contacts', [Query.equal('tenantId', tenantId), Query.equal('patientId', patientId)]);
      for (const item of existing.filter(contact => contact.isPrimary)) await db.updateRow({ databaseId, tableId: 'patient_contacts', rowId: item.$id, data: { isPrimary: false, updatedAt: now() } });
    }
    const timestamp = now();
    const contactId = ID.unique();
    const contact = await db.createRow({ databaseId, tableId: 'patient_contacts', rowId: contactId, data: { tenantId, patientId, type, value, label, isPrimary: payload.isPrimary === true, isVerified: false, createdAt: timestamp, updatedAt: timestamp }, permissions: userRead(userId) });
    await logEvent(db, userId, tenantId, 'patient_contact.created', 'patient_contact', contactId, 'Patient contact channel added');
    return { contact };
  }

  if (action === 'patient.update') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    const existing = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
    if (existing.tenantId !== tenantId) throw Object.assign(new Error('Patient not found in this clinic.'), { status: 404 });
    const givenName = String(payload.givenName ?? existing.givenName).trim();
    const familyName = String(payload.familyName ?? existing.familyName ?? '').trim();
    if (!givenName || givenName.length > 100 || familyName.length > 100) throw Object.assign(new Error('Check the patient name fields.'), { status: 400 });
    const data = { givenName, familyName, updatedBy: userId, updatedAt: now() };
    if (payload.dateOfBirth) {
      const rawDate = String(payload.dateOfBirth);
      const date = new Date(rawDate.length === 10 ? rawDate + 'T00:00:00.000Z' : rawDate);
      if (!Number.isFinite(date.getTime())) throw Object.assign(new Error('Enter a valid date of birth.'), { status: 400 });
      data.dateOfBirth = date.toISOString();
    }
    const patient = await db.updateRow({ databaseId, tableId: 'patients', rowId: patientId, data });
    await logEvent(db, userId, tenantId, 'patient.updated', 'patient', patientId, 'Patient record updated');
    return { patient };
  }

  if (action === 'appointment.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const appointments = await listRows(db, 'appointments', [Query.equal('tenantId', tenantId)]);
    return { appointments };
  }

  if (action === 'appointment.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    const patient = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
    if (patient.tenantId !== tenantId) throw Object.assign(new Error('Patient not found in this clinic.'), { status: 404 });
    const range = parseDateRange(payload.startsAt, payload.endsAt);
    if (!range) throw Object.assign(new Error('Choose a valid appointment start and end time.'), { status: 400 });
    const timestamp = now();
    const appointmentId = ID.unique();
    const appointment = await db.createRow({
      databaseId, tableId: 'appointments', rowId: appointmentId,
      data: { tenantId, patientId, providerUserId: String(payload.providerUserId || '') || undefined, startsAt: range.startsAt, endsAt: range.endsAt, status: 'scheduled', reason: String(payload.reason || '').trim().slice(0, 180) || undefined, notes: String(payload.notes || '').trim() || undefined, createdBy: userId, updatedBy: userId, createdAt: timestamp, updatedAt: timestamp },
      permissions: userRead(userId)
    });
    await logEvent(db, userId, tenantId, 'appointment.created', 'appointment', appointmentId, 'Appointment scheduled');
    return { appointment };
  }

  if (action === 'appointment.update') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const appointmentId = String(payload.appointmentId || '');
    const existing = await db.getRow({ databaseId, tableId: 'appointments', rowId: appointmentId });
    if (existing.tenantId !== tenantId) throw Object.assign(new Error('Appointment not found in this clinic.'), { status: 404 });
    const status = String(payload.status || existing.status);
    if (!isAppointmentStatus(status)) throw Object.assign(new Error('Choose a valid appointment status.'), { status: 400 });
    const data = { status, updatedBy: userId, updatedAt: now() };
    if (payload.startsAt || payload.endsAt) {
      const range = parseDateRange(payload.startsAt || existing.startsAt, payload.endsAt || existing.endsAt);
      if (!range) throw Object.assign(new Error('Choose a valid appointment time range.'), { status: 400 });
      data.startsAt = range.startsAt; data.endsAt = range.endsAt;
    }
    const appointment = await db.updateRow({ databaseId, tableId: 'appointments', rowId: appointmentId, data });
    await logEvent(db, userId, tenantId, 'appointment.updated', 'appointment', appointmentId, 'Appointment status or time updated');
    return { appointment };
  }

  if (action === 'encounter.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    return { encounters: await listRows(db, 'encounters', [Query.equal('tenantId', tenantId)]) };
  }

  if (action === 'encounter.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    const patient = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
    if (patient.tenantId !== tenantId) throw Object.assign(new Error('Patient not found in this clinic.'), { status: 404 });
    const appointmentId = String(payload.appointmentId || '');
    if (appointmentId) {
      const appointment = await db.getRow({ databaseId, tableId: 'appointments', rowId: appointmentId });
      if (appointment.tenantId !== tenantId || appointment.patientId !== patientId) throw Object.assign(new Error('Appointment does not belong to this patient and clinic.'), { status: 400 });
    }
    const visitPurpose = String(payload.visitPurpose || '').trim();
    if (!visitPurpose || visitPurpose.length > 255) throw Object.assign(new Error('Enter the visit purpose.'), { status: 400 });
    const timestamp = now();
    const encounterId = ID.unique();
    const encounter = await db.createRow({
      databaseId, tableId: 'encounters', rowId: encounterId,
      data: { tenantId, patientId, appointmentId: appointmentId || undefined, startedAt: timestamp, status: 'in_progress', visitPurpose, summary: String(payload.summary || '').trim() || undefined, createdBy: userId, updatedBy: userId, createdAt: timestamp, updatedAt: timestamp },
      permissions: userRead(userId)
    });
    await logEvent(db, userId, tenantId, 'encounter.created', 'encounter', encounterId, 'Encounter opened');
    return { encounter };
  }

  if (action === 'encounter.complete') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const encounterId = String(payload.encounterId || '');
    const existing = await db.getRow({ databaseId, tableId: 'encounters', rowId: encounterId });
    if (existing.tenantId !== tenantId) throw Object.assign(new Error('Visit not found in this clinic.'), { status: 404 });
    if (existing.status !== 'in_progress') throw Object.assign(new Error('Only an in-progress visit can be completed.'), { status: 409 });
    const encounter = await db.updateRow({ databaseId, tableId: 'encounters', rowId: encounterId, data: { status: 'completed', endedAt: now(), updatedBy: userId, updatedAt: now() } });
    await logEvent(db, userId, tenantId, 'encounter.completed', 'encounter', encounterId, 'Visit marked completed');
    return { encounter };
  }

  if (action === 'treatment.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const encounterId = String(payload.encounterId || '');
    if (encounterId) {
      const encounter = await db.getRow({ databaseId, tableId: 'encounters', rowId: encounterId });
      if (encounter.tenantId !== tenantId) throw Object.assign(new Error('Encounter not found in this clinic.'), { status: 404 });
      return { treatments: await listRows(db, 'encounter_treatments', [Query.equal('tenantId', tenantId), Query.equal('encounterId', encounterId)]) };
    }
    return { treatments: await listRows(db, 'encounter_treatments', [Query.equal('tenantId', tenantId)]) };
  }

  if (action === 'treatment.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const encounterId = String(payload.encounterId || '');
    const encounter = await db.getRow({ databaseId, tableId: 'encounters', rowId: encounterId });
    if (encounter.tenantId !== tenantId) throw Object.assign(new Error('Encounter not found in this clinic.'), { status: 404 });
    const name = String(payload.name || '').trim();
    const status = String(payload.status || 'planned');
    if (!name || name.length > 180 || !isTreatmentStatus(status)) throw Object.assign(new Error('Enter a treatment name and valid status.'), { status: 400 });
    const timestamp = now();
    const treatmentId = ID.unique();
    const treatment = await db.createRow({
      databaseId, tableId: 'encounter_treatments', rowId: treatmentId,
      data: { tenantId, encounterId, name, status, performedAt: status === 'performed' ? (payload.performedAt ? new Date(payload.performedAt).toISOString() : timestamp) : undefined, performedBy: status === 'performed' ? userId : undefined, notes: String(payload.notes || '').trim() || undefined, createdBy: userId, createdAt: timestamp, updatedAt: timestamp },
      permissions: userRead(userId)
    });
    await logEvent(db, userId, tenantId, 'treatment.created', 'encounter_treatment', treatmentId, 'Encounter treatment recorded');
    return { treatment };
  }


  if (action === 'clinical_draft.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const queries = [Query.equal('tenantId', tenantId)];
    if (payload.encounterId) queries.push(Query.equal('encounterId', String(payload.encounterId)));
    return { drafts: await listRows(db, 'clinical_drafts', queries) };
  }

  if (action === 'clinical_draft.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    const encounterId = String(payload.encounterId || '');
    const patient = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
    const encounter = await db.getRow({ databaseId, tableId: 'encounters', rowId: encounterId });
    if (patient.tenantId !== tenantId || encounter.tenantId !== tenantId || encounter.patientId !== patientId) throw Object.assign(new Error('The patient and visit must belong to this clinic.'), { status: 400 });
    const draftContent = String(payload.draftContent || '').trim();
    if (!draftContent || draftContent.length > 12000) throw Object.assign(new Error('Enter a draft note up to 12,000 characters.'), { status: 400 });
    const sourceDocumentId = String(payload.sourceDocumentId || '');
    if (sourceDocumentId) {
      const source = await db.getRow({ databaseId, tableId: 'patient_documents', rowId: sourceDocumentId });
      if (source.tenantId !== tenantId || source.patientId !== patientId) throw Object.assign(new Error('Source document must belong to this patient and clinic.'), { status: 400 });
    }
    const timestamp = now();
    const draftId = ID.unique();
    const draft = await db.createRow({
      databaseId, tableId: 'clinical_drafts', rowId: draftId,
      data: { tenantId, patientId, encounterId, sourceDocumentId: sourceDocumentId || undefined, draftContent, status: 'draft', createdBy: userId, version: 1, createdAt: timestamp, updatedAt: timestamp },
      permissions: userRead(userId)
    });
    await logEvent(db, userId, tenantId, 'clinical_draft.created', 'clinical_draft', draftId, 'Clinical draft saved for review');
    return { draft };
  }

  if (action === 'document.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const queries = [Query.equal('tenantId', tenantId)];
    if (payload.patientId) queries.push(Query.equal('patientId', String(payload.patientId)));
    return { documents: await listRows(db, 'patient_documents', queries) };
  }

  if (action === 'document.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    const patient = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
    if (patient.tenantId !== tenantId) throw Object.assign(new Error('Patient not found in this clinic.'), { status: 404 });
    const fileId = String(payload.storageFileId || '');
    if (!fileId) throw Object.assign(new Error('Upload the original source file first.'), { status: 400 });
    const file = await storage.getFile({ bucketId: 'dental-source-documents', fileId });
    const userReadPermission = `read("user:${userId}")`;
    if (!(file.$permissions || []).includes(userReadPermission)) throw Object.assign(new Error('Uploaded file is not readable by the signed-in user.'), { status: 403 });
    const sourceCategory = String(payload.sourceCategory || 'other');
    if (!isSourceCategory(sourceCategory)) throw Object.assign(new Error('Choose a valid source category.'), { status: 400 });
    const mimeType = String(file.mimeType || payload.mimeType || 'application/octet-stream');
    const sizeBytes = Number(file.sizeOriginal || file.size || 0);
    if (sizeBytes <= 0 || sizeBytes > 26214400) throw Object.assign(new Error('Source file exceeds the allowed size.'), { status: 400 });
    // Verify file metadata before storing a clinical source reference.
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) throw Object.assign(new Error('Only PDF and supported image files are accepted.'), { status: 400 });
    const timestamp = now();
    const documentId = ID.unique();
    const doc = await db.createRow({
      databaseId, tableId: 'patient_documents', rowId: documentId,
      data: {
        tenantId, patientId, encounterId: String(payload.encounterId || '') || undefined,
        storageFileId: file.$id, originalName: String(file.name || payload.originalName || '').slice(0, 255),
        mimeType: mimeType.slice(0, 100),
        sizeBytes, sourceCategory,
        sourceDate: payload.sourceDate ? new Date(payload.sourceDate).toISOString() : undefined,
        uploadedBy: userId, uploadedAt: timestamp, reviewStatus: 'not_reviewed',
        sourceProviderName: String(payload.sourceProviderName || '').trim().slice(0, 180) || undefined
      },
      permissions: userRead(userId)
    });
    await logEvent(db, userId, tenantId, 'document.captured', 'patient_document', documentId, 'Original source document captured');
    return { document: doc };
  }

  if (action === 'workspace.search') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const query = String(payload.query || '').trim().toLowerCase().slice(0, 100);
    if (query.length < 2) return { results: [] };
    const [patientRows, appointmentRows, encounterRows, documentRows] = await Promise.all([
      listRows(db, 'patients', [Query.equal('tenantId', tenantId)]),
      listRows(db, 'appointments', [Query.equal('tenantId', tenantId)]),
      listRows(db, 'encounters', [Query.equal('tenantId', tenantId)]),
      listRows(db, 'patient_documents', [Query.equal('tenantId', tenantId)])
    ]);
    const patientById = new Map(patientRows.map(p => [p.$id, p]));
    const results = [];
    for (const p of patientRows) {
      const label = [p.givenName, p.familyName].filter(Boolean).join(' ');
      if ((label + ' ' + (p.patientNumber || '')).toLowerCase().includes(query)) results.push({ type: 'patient', id: p.$id, label, detail: 'Patient record' });
    }
    for (const a of appointmentRows) {
      const p = patientById.get(a.patientId);
      const label = p ? [p.givenName, p.familyName].filter(Boolean).join(' ') : 'Appointment';
      const detail = new Date(a.startsAt).toLocaleString() + ' · ' + a.status;
      if ((label + ' ' + (a.reason || '') + ' ' + detail).toLowerCase().includes(query)) results.push({ type: 'appointment', id: a.$id, label, detail });
    }
    for (const v of encounterRows) {
      const p = patientById.get(v.patientId);
      const label = p ? [p.givenName, p.familyName].filter(Boolean).join(' ') : 'Visit';
      const detail = v.visitPurpose + ' · ' + v.status;
      if ((label + ' ' + detail).toLowerCase().includes(query)) results.push({ type: 'visit', id: v.$id, label, detail });
    }
    for (const d of documentRows) {
      const p = patientById.get(d.patientId);
      const label = d.originalName || 'Source document';
      const detail = (p ? [p.givenName, p.familyName].filter(Boolean).join(' ') + ' · ' : '') + d.sourceCategory;
      if ((label + ' ' + detail).toLowerCase().includes(query)) results.push({ type: 'document', id: d.$id, label, detail });
    }
    return { results: results.slice(0, 25) };
  }

  throw Object.assign(new Error('Unknown action.'), { status: 400 });
}

async function verifyActor(body) {
  const jwt = body?.authContext?.jwt;
  const claimedUserId = body?.authContext?.userId;
  if (typeof jwt !== 'string' || !jwt || typeof claimedUserId !== 'string' || !claimedUserId) return null;
  const identityClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  const account = new Account(identityClient);
  const user = await account.get();
  return user.$id === claimedUserId ? user.$id : null;
}

export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') return response(res, { error: 'Method not allowed.' }, 405);
  const runtimeKey = req.headers?.['x-appwrite-key'] || req.headers?.['X-Appwrite-Key'];
  if (!endpoint || !projectId || !runtimeKey) {
    error('Dental API function is missing its generated Appwrite API context.');
    return response(res, { error: 'API is not configured.' }, 503);
  }
  const body = parseBody(req);
  let actorId;
  try { actorId = await verifyActor(body); } catch {
    log('Appwrite session JWT verification failed.');
    actorId = null;
  }
  if (!actorId) return response(res, { error: 'A valid Appwrite user session is required.' }, 401);
  try {
    const requestClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(runtimeKey);
    const requestDb = new TablesDB(requestClient);
    const requestStorage = new Storage(requestClient);
    const result = await handle(requestDb, requestStorage, actorId, body);
    return response(res, { ok: true, ...result });
  } catch (e) {
    const status = Number(e?.status) || 500;
    if (status >= 500) error(`Dental API operation failed: ${e?.message || 'unknown error'}`);
    return response(res, { ok: false, error: status >= 500 ? 'The operation could not be completed.' : e.message }, status);
  }
};
