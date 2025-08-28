import React, { useEffect, useState } from 'react'

export default function FontSizeControl() {
  const MIN = 12
  const MAX = 24
  const STEP = 1
  const STORAGE_KEY = 'rootFontSize'

  const getInitial = (): number => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return Number(raw)
    } catch (e) {
      // ignore
    }
    // fallback to computed style or 16
    try {
      const cs = getComputedStyle(document.documentElement).fontSize
      const n = parseInt(cs || '', 10)
      if (!Number.isNaN(n)) return n
    } catch (e) {}
    return 16
  }

  const [size, setSize] = useState<number>(getInitial)

  useEffect(() => {
    try {
      document.documentElement.style.fontSize = `${size}px`
      localStorage.setItem(STORAGE_KEY, String(size))
    } catch (e) {
      // ignore
    }
  }, [size])

  const increase = () => setSize((s) => Math.min(MAX, s + STEP))
  const decrease = () => setSize((s) => Math.max(MIN, s - STEP))
  const reset = () => setSize(16)

  return (
    <div className="inline-flex items-center space-x-2">
      <button aria-label="Decrease font size" title="Decrease font size" onClick={decrease} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">A-</button>
      <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-200">{size}px</div>
      <button aria-label="Increase font size" title="Increase font size" onClick={increase} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">A+</button>
      <button aria-label="Reset font size" title="Reset font size" onClick={reset} className="ml-2 px-2 py-1 rounded bg-gray-50 dark:bg-gray-900 text-xs text-gray-600">Reset</button>
    </div>
  )
}
