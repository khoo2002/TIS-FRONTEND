import { authFetch } from './auth'

// Tries known spellings of the endpoint to be resilient to backend naming.
const candidates = ['/admin/refresh-view']

export type HardRefreshResult = {
  ok: boolean
  tried: string[]
  lastStatus?: number
  lastText?: string
}

export async function triggerHardRefresh(): Promise<HardRefreshResult> {
  const tried: string[] = []
  let lastStatus: number | undefined
  let lastText: string | undefined
  for (const path of candidates) {
    // Try POST first
    tried.push(`${path} POST`)
    try {
      const res = await authFetch(path, { method: 'POST', headers: { 'Accept': 'application/json, text/plain,*/*' } })
      lastStatus = res.status
      try { lastText = await res.text() } catch {}
      if (res.ok) return { ok: true, tried }
    } catch (e) {
      // ignore and continue
    }
    // Then try GET fallback
    // tried.push(`${path} GET`)
    // try {
    //   const res = await authFetch(path, { method: 'GET', headers: { 'Accept': 'application/json, text/plain,*/*' } })
    //   lastStatus = res.status
    //   try { lastText = await res.text() } catch {}
    //   if (res.ok) return { ok: true, tried }
    // } catch (e) {
    //   // ignore and continue
    // }
  }
  return { ok: false, tried, lastStatus, lastText }
}
