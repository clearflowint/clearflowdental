import { Client, Account, ID, Permission, Role, Query, TablesDB } from 'node-appwrite';

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
async function handle(db, userId, body) {
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
    const slug = String(payload.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
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


  if (action === 'patient.update') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(db, userId, tenantId);
    const patientId = String(payload.patientId || '');
    const existing = await db.getRow({ databaseId, tableId: 'patients', rowId: patientId });
    if (existing.tenantId !== tenantId) throw Object.assign(new Error('Patient not found in this clinic.'), { status: 404 });
    const givenName = String(payload.givenName ?? existing.givenName).trim();
    const familyName = String(payload.familyName ?? existing.familyName ?? '').trim();
    if (!givenName || givenName.length > 100 || familyName.length > 100) throw Object.assign(new Error('Check the patient name fields.'), { status: 400 });
    const patient = await db.updateRow({ databaseId, tableId: 'patients', rowId: patientId, data: { givenName, familyName, updatedBy: userId, updatedAt: now() } });
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
    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(payload.endsAt);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) throw Object.assign(new Error('Choose a valid appointment start and end time.'), { status: 400 });
    const timestamp = now();
    const appointmentId = ID.unique();
    const appointment = await db.createRow({
      databaseId, tableId: 'appointments', rowId: appointmentId,
      data: { tenantId, patientId, providerUserId: String(payload.providerUserId || '') || undefined, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), status: 'scheduled', reason: String(payload.reason || '').trim().slice(0, 180) || undefined, notes: String(payload.notes || '').trim() || undefined, createdBy: userId, updatedBy: userId, createdAt: timestamp, updatedAt: timestamp },
      permissions: userRead(userId)
    });
    await logEvent(db, userId, tenantId, 'appointment.created', 'appointment', appointmentId, 'Appointment scheduled');
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
    if (!name || name.length > 180 || !['discussed', 'planned', 'performed', 'not_performed'].includes(status)) throw Object.assign(new Error('Enter a treatment name and valid status.'), { status: 400 });
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

  throw Object.assign(new Error('Unknown action.'), { status: 400 });
}

async function verifyActor(req) {
  const jwt = req.headers?.['x-appwrite-user-jwt'] || req.headers?.['X-Appwrite-User-JWT'];
  const headerUserId = req.headers?.['x-appwrite-user-id'] || req.headers?.['X-Appwrite-User-Id'];
  if (!jwt || !headerUserId) return null;
  const identityClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  const account = new Account(identityClient);
  const user = await account.get();
  return user.$id === headerUserId ? user.$id : null;
}

export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') return response(res, { error: 'Method not allowed.' }, 405);
  const runtimeKey = req.headers?.['x-appwrite-key'] || req.headers?.['X-Appwrite-Key'];
  if (!endpoint || !projectId || !runtimeKey) {
    error('Dental API function is missing its generated Appwrite API context.');
    return response(res, { error: 'API is not configured.' }, 503);
  }
  let actorId;
  try { actorId = await verifyActor(req); } catch { actorId = null; }
  if (!actorId) return response(res, { error: 'A valid Appwrite user session is required.' }, 401);
  try {
    const requestClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(runtimeKey);
    const requestDb = new TablesDB(requestClient);
    const result = await handle(requestDb, actorId, parseBody(req));
    return response(res, { ok: true, ...result });
  } catch (e) {
    const status = Number(e?.status) || 500;
    if (status >= 500) error(`Dental API operation failed: ${e?.message || 'unknown error'}`);
    return response(res, { ok: false, error: status >= 500 ? 'The operation could not be completed.' : e.message }, status);
  }
};
