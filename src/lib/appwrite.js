import { Account, Client, ID, Permission, Query, Role, TablesDB } from 'appwrite'

const endpoint = (import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://clearflowappwrite.duckdns.org/v1').replace(/\/+$/, '')
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6adcea89003c9613425b'
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'clearflow_dental'

const client = new Client().setEndpoint(endpoint).setProject(projectId)
const account = new Account(client)
const tables = new TablesDB(client)



function rowPermissions(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

function normalize(row) {
  return { ...row, id: row.$id }
}

export async function checkAppwriteConnection() {
  const response = await fetch(`${endpoint}/health/version`, { headers: { Accept: 'application/json' } })
  return response.ok
}

export async function registerWithAppwrite(email, password, ownerName) {
  await account.create({ userId: ID.unique(), email: email.trim(), password, name: ownerName.trim() })
}

export async function loginToAppwrite(email, password): Promise<void> {
  await account.createEmailPasswordSession({ email: email.trim(), password })
}

export async function getCurrentUser() {
  return account.get()
}

export async function getMyClinic(userId): Promise<Clinic | null> {
  const result = await tables.listRows({
    databaseId,
    tableId: 'dental_clinics',
    queries: [Query.equal('owner_user_id', userId), Query.limit(1)],
  })
  return result.rows[0] ? normalize(result.rows[0]) : null
}

export async function createClinic(clinicName, userId: string): Promise<Clinic> {
  const row = await tables.createRow({
    databaseId,
    tableId: 'dental_clinics',
    rowId: ID.unique(),
    data: { clinic_name: clinicName.trim(), owner_user_id: userId },
    permissions: rowPermissions(userId),
  })
  return normalize(row) as unknown as Clinic
}

export async function listPatients(clinicId, userId: string): Promise<Patient[]> {
  const result = await tables.listRows({
    databaseId,
    tableId: 'dental_patients',
    queries: [Query.equal('clinic_id', clinicId), Query.equal('owner_user_id', userId), Query.orderAsc('full_name'), Query.limit(500)],
  }) as AppwriteList<AppwriteRow>
  return result.rows.map((row) => normalize(row))
}

export async function createPatient(clinicId: string, userId: string, input): Promise<Patient> {
  const row = await tables.createRow({
    databaseId,
    tableId: 'dental_patients',
    rowId: ID.unique(),
    data: { clinic_id: clinicId, owner_user_id: userId, full_name: input.full_name.trim(), phone: input.phone.trim() || null, notes: input.notes.trim() || null },
    permissions: rowPermissions(userId),
  })
  return normalize(row as AppwriteRow) as unknown as Patient
}

export async function listVisits(clinicId: string, userId: string): Promise<Visit[]> {
  const result = await tables.listRows({
    databaseId,
    tableId: 'dental_visits',
    queries: [Query.equal('clinic_id', clinicId), Query.equal('owner_user_id', userId), Query.orderDesc('treatment_date'), Query.limit(1000)],
  }) as AppwriteList<AppwriteRow>
  return result.rows.map((row) => normalize(row))
}

export async function createVisit(clinicId: string, userId: string, patientId, input): Promise<Visit> {
  const row = await tables.createRow({
    databaseId,
    tableId: 'dental_visits',
    rowId: ID.unique(),
    data: {
      clinic_id: clinicId, owner_user_id: userId, patient_id: patientId,
      treatment_name: input.treatment_name.trim(), treatment_date: input.treatment_date,
      doctor_advice: input.doctor_advice.trim() || null, next_visit_date: input.next_visit_date || null,
    },
    permissions: rowPermissions(userId),
  })
  return normalize(row as AppwriteRow) as unknown as Visit
}

export async function logoutFromAppwrite(): Promise<void> {
  try { await account.deleteSession({ sessionId: 'current' }) } catch { /* already signed out */ }
}
