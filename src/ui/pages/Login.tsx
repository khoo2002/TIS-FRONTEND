import React, { useState } from 'react'
import { loginRequest } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('changeme')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginRequest(email, password)
  // navigate to root
  try { window.scrollTo({ top: 0, left: 0 }) } catch {}
  window.location.assign('/')
    } catch (e: any) {
      setError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-6 py-12 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
  <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow space-y-4">
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-sm text-gray-600">Email</label>
          <input className="mt-1 w-full p-2 border rounded" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Password</label>
          <input type="password" className="mt-1 w-full p-2 border rounded" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
  <button type="submit" disabled={loading} className="w-full py-2 bg-pink-600 text-white rounded disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
