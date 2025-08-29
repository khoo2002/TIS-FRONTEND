export const AUTH_TOKEN_KEY = 'access_token'
const USER_EMAIL_KEY = 'user_email'

export function getToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch (e) {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch (e) {}
}

export function clearToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_EMAIL_KEY)
  } catch (e) {}
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(input, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    try { window.scrollTo({ top: 0, left: 0 }) } catch {}
    window.history.pushState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  return res
}

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  const { access_token } = await res.json()
  setToken(access_token)
  try { localStorage.setItem(USER_EMAIL_KEY, email) } catch {}
  return access_token
}

function base64UrlDecode(input: string): string {
  try {
    let s = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s = s + '='.repeat(4 - pad);
    return atob(s);
  } catch {
    return ''
  }
}

export type UserInfo = { sub?: string; roles?: string[]; email?: string }

export function getUserInfo(): UserInfo {
  const token = getToken()
  let sub: string | undefined
  let roles: string[] | undefined
  if (token) {
    const parts = token.split('.')
    if (parts.length >= 2) {
      const payloadJson = base64UrlDecode(parts[1])
      try {
        const payload = JSON.parse(payloadJson || '{}') as any
        sub = typeof payload.sub === 'string' ? payload.sub : undefined
        if (Array.isArray(payload.roles)) roles = payload.roles as string[]
      } catch {}
    }
  }
  let email: string | undefined
  try { email = localStorage.getItem(USER_EMAIL_KEY) || undefined } catch {}
  return { sub, roles, email }
}
