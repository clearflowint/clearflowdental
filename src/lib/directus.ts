const DIRECTUS_URL = (import.meta.env.VITE_DIRECTUS_URL || 'https://clearflow-data.duckdns.org').replace(/\/+$/, '')

type DirectusResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

export type DirectusLoginResult = {
  accessToken: string
  expires: number
}

let accessToken: string | null = null

export function getDirectusUrl(): string {
  return DIRECTUS_URL
}

export function getAccessToken(): string | null {
  return accessToken
}

export async function checkDirectusConnection(): Promise<boolean> {
  const response = await fetch(`${DIRECTUS_URL}/server/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return false
  const result = (await response.json()) as { status?: string }
  return result.status === 'ok'
}

export async function loginToDirectus(email: string, password: string): Promise<DirectusLoginResult> {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, mode: 'json' }),
  })

  const result = (await response.json().catch(() => ({}))) as DirectusResponse<{
    access_token?: string
    expires?: number
  }>

  if (!response.ok || !result.data?.access_token) {
    throw new Error('DIRECTUS_LOGIN_FAILED')
  }

  accessToken = result.data.access_token
  return {
    accessToken,
    expires: result.data.expires ?? 0,
  }
}

export function logoutFromDirectus(): void {
  // Access token is intentionally memory-only in this initial POC.
  // Refreshing the page clears it; persistent sessions will be designed later.
  accessToken = null
}
