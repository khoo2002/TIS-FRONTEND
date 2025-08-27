import React from 'react'

export default function FontSizeControl() {
  const setSize = (size: 'small'|'normal'|'large') => {
    const root = document.documentElement
    root.style.fontSize = (size === 'small') ? '14px' : (size === 'large') ? '18px' : '16px'
  }

  return (
    <div className="inline-flex items-center space-x-2">
      <button className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm" onClick={() => setSize('small')}>A-</button>
      <button className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm" onClick={() => setSize('normal')}>A</button>
      <button className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm" onClick={() => setSize('large')}>A+</button>
    </div>
  )
}
