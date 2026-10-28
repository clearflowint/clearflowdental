import { Client, Account, ID, Permission, Role, Query, TablesDB, Storage } from 'node-appwrite';
import { normalizeSlug, parseDateRange, isSourceCategory, isTreatmentStatus, isAppointmentStatus, isContactType, CONTACT_LABELS, normalizeContactValue } from './domain.js';
import { AI_PROVIDERS, isSupportedProviderModel } from './ai-config.js';
import { encryptProviderKey, decryptProviderKey } from './ai-credentials.js';

function normalizeAppwriteEndpoint(raw) {
  if (!raw) return raw;
  const url = new URL(raw);
  // Function runtime can expose a realtime route as the API endpoint. Database SDK calls must use the REST /v1 base.
  if (url.pathname.endsWith('/realtime/v1')) url.pathname = url.pathname.slice(0, -12);
  while (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
  if (!url.pathname || url.pathname === '/') url.pathname = '/v1';
  else if (!url.pathname.endsWith('/v1')) url.pathname += '/v1';
  url.search = '';
  url.hash = '';
  return url.origin + url.pathname;
}
const endpoint = normalizeAppwriteEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT);
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
  const allQueries = [...queries, Query.limit(100)];
  try {
    const result = await db.listRows({ databaseId, tableId, queries: allQueries });
    return result.rows || [];
  } catch (e) {
    // Diagnostic context deliberately excludes query values, user IDs and credentials.
    const endpointParts = (() => { try { const u = new URL(endpoint); return { host: u.host, path: u.pathname }; } catch { return { host: 'invalid-endpoint', path: '' }; } })();
    e.message = `listRows failed; database=${databaseId}; table=${tableId}; queryCount=${allQueries.length}; queryMethods=${allQueries.map(q => { try { return JSON.parse(q).method; } catch { return 'non-json'; } }).join(',')}; endpointHost=${endpointParts.host}; endpointPath=${endpointParts.path}; original=${String(e?.message || 'unknown').slice(0, 180)}`;
    throw e;
  }
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

  if (action === 'ai.providers.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    return { providers: AI_PROVIDERS.map(provider => ({ id: provider.id, name: provider.name, models: [...provider.models] })) };
  }

  if (action === 'ai.settings.get') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const rows = await listRows(db, 'tenant_ai_preferences', [Query.equal('tenantId', tenantId)]);
    const settings = rows[0] || {
      tenantId, defaultProviderId: '', defaultModelId: '',
      embeddingProviderId: '', embeddingModelId: '',
      memoryEnabled: false, monthlyBudgetMinor: null, budgetCurrency: 'INR'
    };
    const credentials = await listRows(db, 'tenant_ai_provider_credentials', [Query.equal('tenantId', tenantId)]);
    return { settings, providers: credentials.map(c => ({ providerId: c.providerId, status: c.status, maskedSuffix: c.maskedSuffix || '' })) };
  }

  if (action === 'ai.credentials.save') {
    const tenantId = String(payload.tenantId || '');
    const membership = await requireMembership(db, userId, tenantId);
    if (!['owner', 'admin'].includes(String(membership.role || '').toLowerCase())) {
      throw Object.assign(new Error('Only clinic owners or admins can connect an AI provider.'), { status: 403 });
    }
    const providerId = String(payload.providerId || '');
    if (!AI_PROVIDERS.some(provider => provider.id === providerId)) {
      throw Object.assign(new Error('Choose a supported AI provider.'), { status: 400 });
    }
    const encrypted = encryptProviderKey(payload.apiKey);
    const existingRows = await listRows(db, 'tenant_ai_provider_credentials', [
      Query.equal('tenantId', tenantId), Query.equal('providerId', providerId)
    ]);
    const timestamp = now();
    const data = {
      tenantId, providerId, ...encrypted, status: 'connected',
      createdBy: userId, updatedAt: timestamp
    };
    if (existingRows[0]) {
      await db.updateRow({ databaseId, tableId: 'tenant_ai_provider_credentials', rowId: existingRows[0].$id, data });
    } else {
      await db.createRow({ databaseId, tableId: 'tenant_ai_provider_credentials', rowId: ID.unique(), data: { ...data, createdAt: timestamp } });
    }
    await logEvent(db, userId, tenantId, 'ai.credentials.connected', 'ai_provider', providerId, 'Clinic AI provider credential connected');
    return { connected: true, providerId, status: 'connected', maskedSuffix: encrypted.maskedSuffix };
  }

  if (action === 'ai.settings.update') {
    const tenantId = String(payload.tenantId || '');
    const membership = await requireMembership(db, userId, tenantId);
    if (!['owner', 'admin'].includes(String(membership.role || '').toLowerCase())) {
      throw Object.assign(new Error('Only clinic owners or admins can change AI settings.'), { status: 403 });
    }
    const providerId = String(payload.defaultProviderId || '');
    const modelId = String(payload.defaultModelId || '');
    if (providerId && !AI_PROVIDERS.some(provider => provider.id === providerId)) throw Object.assign(new Error('Choose a supported AI provider.'), { status: 400 });
    if (providerId && !isSupportedProviderModel(providerId, modelId)) throw Object.assign(new Error('Choose a model from the selected provider.'), { status: 400 });
    const budget = payload.monthlyBudgetMinor === '' || payload.monthlyBudgetMinor == null ? null : Number(payload.monthlyBudgetMinor);
    if (budget !== null && (!Number.isSafeInteger(budget) || budget < 0 || budget > 100000000000)) throw Object.assign(new Error('Enter a valid non-negative monthly budget in paise.'), { status: 400 });
    const existingRows = await listRows(db, 'tenant_ai_preferences', [Query.equal('tenantId', tenantId)]);
    const timestamp = now();
    const data = {
      tenantId, defaultProviderId: providerId, defaultModelId: modelId,
      embeddingProviderId: String(payload.embeddingProviderId || '').slice(0, 80),
      embeddingModelId: String(payload.embeddingModelId || '').slice(0, 160),
      memoryEnabled: payload.memoryEnabled === true,
      monthlyBudgetMinor: budget,
      budgetCurrency: 'INR',
      updatedAt: timestamp
    };
    let settings;
    if (existingRows[0]) {
      settings = await db.updateRow({ databaseId, tableId: 'tenant_ai_preferences', rowId: existingRows[0].$id, data });
    } else {
      settings = await db.createRow({ databaseId, tableId: 'tenant_ai_preferences', rowId: ID.unique(), data: { ...data, createdAt: timestamp } });
    }
    await logEvent(db, userId, tenantId, 'ai.settings.updated', 'ai_settings', tenantId, 'AI provider preferences updated');
    return { settings };
  }

  if (action === 'ai.history.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const conversationId = String(payload.conversationId || '');
    if (!conversationId || conversationId.length > 128) throw Object.assign(new Error('A valid conversation is required.'), { status: 400 });
    const messages = await listRows(db, 'tenant_ai_messages', [
      Query.equal('tenantId', tenantId), Query.equal('conversationId', conversationId),
      Query.orderAsc('createdAt')
    ]);
    return { messages: messages.filter(m => m.actorId === userId).map(m => ({ role: m.role, content: m.content, createdAt: m.createdAt, requestId: m.requestId || '' })) };
  }

  if (action === 'ai.chat') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const message = String(payload.message || '').trim();
    const conversationId = String(payload.conversationId || '');
    if (!conversationId || conversationId.length > 128) throw Object.assign(new Error('A valid conversation is required.'), { status: 400 });
    if (!message) throw Object.assign(new Error('Enter a question first.'), { status: 400 });
    if (message.length > 6000) throw Object.assign(new Error('Questions must be 6,000 characters or fewer.'), { status: 400 });

    const preferenceRows = await listRows(db, 'tenant_ai_preferences', [Query.equal('tenantId', tenantId)]);
    const preferences = preferenceRows[0] || {};
    const providerId = String(preferences.defaultProviderId || '');
    const modelId = String(preferences.defaultModelId || '');
    if (!providerId || !isSupportedProviderModel(providerId, modelId)) {
      throw Object.assign(new Error('Choose and save a supported AI provider and model in AI settings first.'), { status: 409 });
    }
    try {
      await db.createRow({
        databaseId, tableId: 'tenant_ai_messages', rowId: ID.unique(),
        data: { tenantId, actorId: userId, conversationId, role: 'user', content: message, createdAt: now() },
        permissions: userRead(userId)
      });
    } catch (e) {
      throw Object.assign(new Error('Conversation history is not configured yet. Apply the AI message table migration and retry.'), { status: 503 });
    }
    const credentialRows = await listRows(db, 'tenant_ai_provider_credentials', [
      Query.equal('tenantId', tenantId), Query.equal('providerId', providerId), Query.equal('status', 'connected')
    ]);
    if (!credentialRows[0]) {
      return { ok: false, status: 'provider_not_connected', message: 'Connect this clinic’s provider API key in AI settings before chatting.', clinicalDataChanged: false };
    }
    if (!process.env.CLEARFLOW_AI_ENCRYPTION_KEY) {
      throw Object.assign(new Error('AI credential encryption is not configured on the server.'), { status: 503 });
    }
    if (Number.isSafeInteger(preferences.monthlyBudgetMinor) && preferences.monthlyBudgetMinor >= 0) {
      const monthStart = new Date();
      monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
      const usage = await listRows(db, 'tenant_ai_usage', [
        Query.equal('tenantId', tenantId), Query.greaterThanEqual('occurredAt', monthStart.toISOString())
      ]);
      const spent = usage.reduce((sum, row) => sum + (Number(row.costMinor) || 0), 0);
      if (spent >= preferences.monthlyBudgetMinor) {
        return { ok: false, status: 'budget_exhausted', message: 'This clinic has reached its configured monthly AI budget.', clinicalDataChanged: false };
      }
    }

    const apiKey = decryptProviderKey(credentialRows[0]);
    let targetUrl, headers, requestBody, extractReply, extractUsage;
    if (providerId === 'anthropic') {
      targetUrl = 'https://api.anthropic.com/v1/messages';
      headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
      requestBody = { model: modelId, max_tokens: 1200, messages: [{ role: 'user', content: message }] };
      extractReply = data => (data.content || []).filter(part => part.type === 'text').map(part => part.text).join('\n');
      extractUsage = data => ({ input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 });
    } else if (providerId === 'google') {
      targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelId) + ':generateContent?key=' + encodeURIComponent(apiKey);
      headers = { 'Content-Type': 'application/json' };
      requestBody = { contents: [{ parts: [{ text: message }] }], generationConfig: { maxOutputTokens: 1200 } };
      extractReply = data => (data.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n');
      extractUsage = data => ({ input: data.usageMetadata?.promptTokenCount || 0, output: data.usageMetadata?.candidatesTokenCount || 0 });
    } else {
      const base = providerId === 'groq' ? 'https://api.groq.com/openai/v1' :
        providerId === 'mistral' ? 'https://api.mistral.ai/v1' :
        providerId === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
      targetUrl = base + '/chat/completions';
      headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey };
      requestBody = { model: modelId, messages: [{ role: 'user', content: message }], max_tokens: 1200 };
      extractReply = data => data.choices?.[0]?.message?.content || '';
      extractUsage = data => ({ input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 });
    }

    const requestId = ID.unique();
    const startedAt = Date.now();
    let upstream, result;
    try {
      upstream = await fetch(targetUrl, {
        method: 'POST', headers, body: JSON.stringify(requestBody), signal: AbortSignal.timeout(45000)
      });
      result = await upstream.json();
    } catch {
      throw Object.assign(new Error('The AI provider could not be reached. Check the clinic provider key and try again.'), { status: 502 });
    }
    if (!upstream.ok) {
      const providerMessage = String(result?.error?.message || result?.message || '');
      if (upstream.status === 401 || upstream.status === 403) {
        throw Object.assign(new Error('The provider rejected this clinic API key. Reconnect the key in AI settings.'), { status: 422 });
      }
      if (upstream.status === 429) throw Object.assign(new Error('The provider rate limit was reached. Try again shortly.'), { status: 429 });
      throw Object.assign(new Error('The AI provider returned an error' + (providerMessage ? ': ' + providerMessage.slice(0, 180) : '.') ), { status: 502 });
    }
    const reply = String(extractReply(result) || '').trim();
    if (!reply) throw Object.assign(new Error('The provider returned an empty response. Try again.'), { status: 502 });
    const tokenUsage = extractUsage(result);
    const latencyMs = Math.max(0, Date.now() - startedAt);
    try {
      await db.createRow({
        databaseId, tableId: 'tenant_ai_messages', rowId: ID.unique(),
        data: { tenantId, actorId: userId, conversationId, role: 'assistant', content: reply.slice(0, 12000), requestId, createdAt: now() },
        permissions: userRead(userId)
      });
    } catch {
      throw Object.assign(new Error('AI replied, but conversation history could not be saved. Apply the AI message table migration.'), { status: 503 });
    }
    // Usage rows are recorded without storing prompts, responses, or API keys.
    // Initial prototype cost is left at zero until per-model price tables are added.
    try {
      await db.createRow({
        databaseId, tableId: 'tenant_ai_usage', rowId: ID.unique(),
        data: {
          tenantId, actorId: userId, providerId, modelId, requestId,
          inputTokens: tokenUsage.input, outputTokens: tokenUsage.output,
          costMinor: 0, currency: 'INR', status: 'completed', latencyMs, occurredAt: now()
        },
        permissions: userRead(userId)
      });
    } catch (e) { log('AI reply succeeded but usage logging failed; no prompt or credential data logged.'); }
    return { ok: true, status: 'completed', requestId, reply: reply.slice(0, 12000), clinicalDataChanged: false, latencyMs, usage: tokenUsage };
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

async function verifyActor(body, headers = {}) {
  // Appwrite injects the authenticated caller identity into Function execution
  // context when the execution is authorized for a signed-in user.
  // Prefer the platform-provided identity; do not trust the body userId alone.
  const platformUserId = headers['x-appwrite-user-id'] || headers['X-Appwrite-User-Id'];
  if (typeof platformUserId === 'string' && platformUserId.trim()) return platformUserId.trim();

  // Compatibility fallback for installations that do not inject the caller ID.
  const jwt = headers['x-appwrite-user-jwt'] || headers['X-Appwrite-User-JWT'] ||
    headers['x-clearflow-user-jwt'] || headers['X-Clearflow-User-JWT'] || body?.authContext?.jwt;
  const claimedUserId = body?.authContext?.userId;
  if (typeof jwt !== 'string' || !jwt || typeof claimedUserId !== 'string' || !claimedUserId) return null;
  const identityClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  const user = await new Account(identityClient).get();
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
  try { actorId = await verifyActor(body, req.headers || {}); } catch (e) {
    // Diagnostic only: never log the JWT or request body.
    log(`Appwrite session JWT verification failed; authContext=${Boolean(body?.authContext)}, jwtPresent=${typeof body?.authContext?.jwt === 'string' && body.authContext.jwt.length > 0}, userIdPresent=${typeof body?.authContext?.userId === 'string' && body.authContext.userId.length > 0}, error=${String(e?.message || 'unknown').slice(0, 180)}`);
    actorId = null;
  }
  if (!actorId) {
    log(`Rejected unauthenticated request; bodyKeys=${Object.keys(body || {}).join(',').slice(0, 120)}`);
    return response(res, { error: 'A valid Appwrite user session is required.' }, 401);
  }
  try {
    const requestClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(runtimeKey);
    const requestDb = new TablesDB(requestClient);
    const requestStorage = new Storage(requestClient);
    const result = await handle(requestDb, requestStorage, actorId, body);
    return response(res, { ok: true, ...result });
  } catch (e) {
    const status = Number(e?.status) || 500;
    if (e?.name === 'AppwriteException' || status >= 500) {
      error(`Dental API request diagnostic: status=${status}; name=${String(e?.name || 'Error')}; code=${String(e?.code || '')}; type=${String(e?.type || '')}; message=${String(e?.message || 'unknown error').slice(0, 320)}; endpointHost=${(() => { try { return new URL(endpoint).host; } catch { return 'invalid-endpoint'; } })()}; database=${databaseId}; stack=${String(e?.stack || '').slice(0, 900)}`);
    }
    return response(res, { ok: false, error: body?.action === 'ai.chat' && status === 503 ? String(e?.message || 'AI service is not configured.') : status >= 500 ? 'The operation could not be completed.' : e.message }, status);
  }
};
