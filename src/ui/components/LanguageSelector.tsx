import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSelector() {
  const { i18n } = useTranslation()

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm"
    >
      <option value="en">EN</option>
      <option value="ms">MS</option>
    </select>
  )
}
