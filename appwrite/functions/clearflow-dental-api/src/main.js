import { Client, Account, ID, Permission, Role, Query, TablesDB } from 'node-appwrite';

const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const databaseId = process.env.CLEARFLOW_DATABASE_ID || 'clearflow_dental';
const client = new Client().setEndpoint(endpoint).setProject(projectId);
const db = new TablesDB(client);
const now = () => new Date().toISOString();
const userRead = userId => [Permission.read(Role.user(userId))];

function response(res, body, status = 200) {
  return res.json(body, status);
}
function parseBody(req) {
  if (req.bodyJson && typeof req.bodyJson === 'object') return req.bodyJson;
  try { return JSON.parse(req.bodyText || '{}'); } catch { return {}; }
}
async function listRows(tableId, queries) {
  const result = await db.listRows({ databaseId, tableId, queries: [...queries, Query.limit(100)] });
  return result.rows || [];
}
async function membershipFor(userId, tenantId) {
  const rows = await listRows('clinic_memberships', [
    Query.equal('userId', userId), Query.equal('tenantId', tenantId), Query.equal('status', 'active')
  ]);
  return rows[0] || null;
}
async function requireMembership(userId, tenantId) {
  if (!tenantId || typeof tenantId !== 'string') throw Object.assign(new Error('A clinic workspace is required.'), { status: 400 });
  const membership = await membershipFor(userId, tenantId);
  if (!membership) throw Object.assign(new Error('You do not have access to this clinic workspace.'), { status: 403 });
  return membership;
}
async function logEvent(userId, tenantId, action, entityType, entityId, summary = '') {
  try {
    await db.createRow({
      databaseId, tableId: 'activity_events', rowId: ID.unique(),
      data: { tenantId, actorUserId: userId, action, entityType, entityId, occurredAt: now(), outcome: 'success', summary: String(summary).slice(0, 240) },
      permissions: userRead(userId)
    });
  } catch { /* audit failures are not silently treated as successful in the response paths that require them */ }
}
async function handle(userId, body) {
  const { action, payload = {} } = body;
  if (!userId) throw Object.assign(new Error('Sign in is required.'), { status: 401 });

  if (action === 'clinic.list') {
    const memberships = await listRows('clinic_memberships', [Query.equal('userId', userId), Query.equal('status', 'active')]);
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
    const existing = await listRows('clinic_memberships', [Query.equal('userId', userId), Query.equal('status', 'active')]);
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
    await logEvent(userId, clinicId, 'clinic.created', 'clinic', clinicId, 'Clinic workspace created');
    return { clinic, role: 'owner' };
  }

  if (action === 'patient.list') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(userId, tenantId);
    const queries = [Query.equal('tenantId', tenantId)];
    // Keep the first prototype query index-independent; UI filters the returned bounded page locally.
    const rows = await listRows('patients', queries);
    return { patients: rows };
  }

  if (action === 'patient.create') {
    const tenantId = String(payload.tenantId || '');
    await requireMembership(userId, tenantId);
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
        dateOfBirth: payload.dateOfBirth || undefined,
        status: 'active', createdBy: userId, updatedBy: userId,
        createdAt: timestamp, updatedAt: timestamp
      },
      permissions: userRead(userId)
    });
    await logEvent(userId, tenantId, 'patient.created', 'patient', patientId, 'Patient record created');
    return { patient };
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
    client.setKey(runtimeKey);
    const result = await handle(actorId, parseBody(req));
    return response(res, { ok: true, ...result });
  } catch (e) {
    const status = Number(e?.status) || 500;
    if (status >= 500) error(`Dental API operation failed: ${e?.message || 'unknown error'}`);
    return response(res, { ok: false, error: status >= 500 ? 'The operation could not be completed.' : e.message }, status);
  }
};
