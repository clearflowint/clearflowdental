const DIRECTUS_URL = (import.meta.env.VITE_DIRECTUS_URL || 'https://clearflow-data.duckdns.org').replace(/\/+$/, '')

type DirectusEnvelope<T> = { data?: T; errors?: Array<{ message?: string }> }
type DirectusUser = { id: string; email: string; role?: string | { id: string; name?: string } }
export type Clinic = { id: number; clinic_name: string; owner: string }
export type Patient = { id: number; clinic_id: number; full_name: string; phone: string | null; notes: string | null }
export type Visit = { id: number; clinic_id: number; patient_id: number; treatment_name: string; treatment_date: string; doctor_advice: string | null; next_visit_date: string | null }

let accessToken: string | null = null

export function getDirectusUrl(): string {
  return DIRECTUS_URL
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${DIRECTUS_URL}${path}`, { ...init, headers })
  const result = (await response.json().catch(() => ({}))) as DirectusEnvelope<T>
  if (!response.ok) {
    const message = result.errors?.map((error) => error.message).filter(Boolean).join('; ')
    throw new Error(message || `Directus request failed (${response.status})`)
  }
  return result.data as T
}

export async function checkDirectusConnection(): Promise<boolean> {
  const response = await fetch(`${DIRECTUS_URL}/server/ping`, {
    method: 'GET',
    headers: { Accept: 'text/plain' },
  })
  if (!response.ok) return false
  return (await response.text()).trim().toLowerCase() === 'pong'
}

export async function registerWithDirectus(email: string, password: string, ownerName: string): Promise<void> {
  const parts = ownerName.trim().split(/\s+/)
  const response = await fetch(`${DIRECTUS_URL}/users/register`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password,
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || 'Owner',
    }),
  })
  const result = (await response.json().catch(() => ({}))) as DirectusEnvelope<unknown>
  if (!response.ok) {
    const detail = result.errors?.map((error) => error.message).filter(Boolean).join('; ')
    throw new Error(detail || 'Account creation failed. Check whether registration is enabled in Directus.')
  }
}

export async function loginToDirectus(email: string, password: string): Promise<void> {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, mode: 'json' }),
  })
  const result = (await response.json().catch(() => ({}))) as DirectusEnvelope<{ access_token?: string }>
  if (!response.ok || !result.data?.access_token) {
    const detail = result.errors?.map((error) => error.message).filter(Boolean).join('; ')
    throw new Error(detail || 'Sign-in failed. Check your email and password.')
  }
  accessToken = result.data.access_token
}

export async function getCurrentUser(): Promise<DirectusUser> {
  return request<DirectusUser>('/users/me?fields=id,email,role')
}

export async function getMyClinic(userId: string): Promise<Clinic | null> {
  const params = new URLSearchParams()
  params.set('filter[owner][_eq]', userId)
  params.set('fields', 'id,clinic_name,owner')
  params.set('limit', '1')
  const clinics = await request<Clinic[]>(`/items/dental_clinics?${params.toString()}`)
  return clinics[0] ?? null
}

export async function createClinic(clinicName: string, userId: string): Promise<Clinic> {
  return request<Clinic>('/items/dental_clinics', {
    method: 'POST',
    body: JSON.stringify({ clinic_name: clinicName.trim(), owner: userId }),
  })
}

export async function listPatients(clinicId: number): Promise<Patient[]> {
  const params = new URLSearchParams()
  params.set('filter[clinic_id][_eq]', String(clinicId))
  params.set('fields', 'id,clinic_id,full_name,phone,notes')
  params.set('sort', 'full_name')
  params.set('limit', '500')
  return request<Patient[]>(`/items/dental_patients?${params.toString()}`)
}

export async function createPatient(clinicId: number, input: { full_name: string; phone: string; notes: string }): Promise<Patient> {
  return request<Patient>('/items/dental_patients', {
    method: 'POST',
    body: JSON.stringify({
      clinic_id: clinicId,
      full_name: input.full_name.trim(),
      phone: input.phone.trim() || null,
      notes: input.notes.trim() || null,
    }),
  })
}

export async function listVisits(clinicId: number): Promise<Visit[]> {
  const params = new URLSearchParams()
  params.set('filter[clinic_id][_eq]', String(clinicId))
  params.set('fields', 'id,clinic_id,patient_id,treatment_name,treatment_date,doctor_advice,next_visit_date')
  params.set('sort', '-treatment_date')
  params.set('limit', '1000')
  return request<Visit[]>(`/items/dental_visits?${params.toString()}`)
}

export async function createVisit(clinicId: number, patientId: number, input: {
  treatment_name: string; treatment_date: string; doctor_advice: string; next_visit_date: string
}): Promise<Visit> {
  return request<Visit>('/items/dental_visits', {
    method: 'POST',
    body: JSON.stringify({
      clinic_id: clinicId,
      patient_id: patientId,
      treatment_name: input.treatment_name.trim(),
      treatment_date: input.treatment_date,
      doctor_advice: input.doctor_advice.trim() || null,
      next_visit_date: input.next_visit_date || null,
    }),
  })
}

export function logoutFromDirectus(): void {
  accessToken = null
}
