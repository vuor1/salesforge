'use client'

import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function toggle() {
    i18n.changeLanguage(i18n.language === 'fi' ? 'en' : 'fi')
  }

  return (
    <button
      onClick={toggle}
      className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded"
    >
      {i18n.language === 'fi' ? 'EN' : 'FI'}
    </button>
  )
}
