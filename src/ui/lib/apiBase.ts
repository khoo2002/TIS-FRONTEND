// Configurable API base. Prefer Vite env var, else window.API_BASE, else empty (same origin)
export const API_BASE: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) ||
  (typeof window !== 'undefined' && (window as any).API_BASE) ||
  ''

export function api(path: string): string {
  if (!API_BASE) return path
  // ensure exactly one slash between base and path
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
