import React, { useEffect, useState } from 'react'
import { api } from '../lib/apiBase'

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return String(d) }
}

export default function PublicAlertDetail({ slug }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
  const resp = await fetch(api(`/public/alert/${encodeURIComponent(slug)}`), { headers: { accept: 'application/json' } })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (mounted) setData(json)
      } catch (e) {
        if (mounted) setError(String(e.message || e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [slug])

  function NavLink({ href, children }) {
    return React.createElement('a', {
      href,
      onClick: (e) => { e.preventDefault(); history.pushState({}, '', href); window.dispatchEvent(new PopStateEvent('popstate')) },
      className: 'text-pink-600 hover:underline'
    }, children)
  }

  if (loading) return React.createElement('div', { className: 'p-6 text-gray-600' }, 'Loading…')
  if (error) return React.createElement('div', { className: 'p-6 text-red-600' }, `Error: ${error}`)
  if (!data) return React.createElement('div', { className: 'p-6 text-gray-600' }, 'No data')

  const a = data
  const title = a.title || a.slug
  const refs = Array.isArray(a.references) ? a.references : []

  return (
    React.createElement('main', { className: 'container mx-auto px-6 py-8' }, [
      React.createElement('div', { key: 'crumb', className: 'text-sm text-gray-600 mb-4' }, [
        React.createElement(NavLink, { key: 'home', href: '/viewer' }, 'Viewer'), ' / ', a.slug
      ]),
      React.createElement('h1', { key: 'h1', className: 'text-2xl font-bold text-gray-800' }, title),
      React.createElement('div', { key: 'meta', className: 'mt-2 text-sm text-gray-600' }, `Severity: ${a.severity ?? 'UNKNOWN'} • Published: ${formatDate(a.published_at)}`),
      React.createElement('section', { key: 'sum', className: 'mt-4 bg-white dark:bg-gray-800 p-4 rounded shadow' }, [
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Summary'),
        React.createElement('div', { className: 'mt-2 text-gray-800 dark:text-gray-100 whitespace-pre-wrap' }, a.summary || a.body_md || 'No summary available.'),
      ]),
      React.createElement('section', { key: 'refs', className: 'mt-4 bg-white dark:bg-gray-800 p-4 rounded shadow' }, [
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'References'),
        refs.length ? React.createElement('ul', { className: 'list-disc pl-5 mt-2 space-y-1' }, refs.map((r, i) => (
          React.createElement('li', { key: i }, React.createElement('a', { className: 'text-pink-600 hover:underline', href: r.url, target: '_blank', rel: 'noreferrer' }, r.title || r.url))
        ))) : React.createElement('div', { className: 'text-sm text-gray-600 mt-2' }, 'No references.')
      ])
    ])
  )
}
