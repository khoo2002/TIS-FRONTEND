import React from 'react'
import { useTheme } from 'next-themes'

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm"
      aria-pressed={resolvedTheme === 'dark'}
    >
      {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
