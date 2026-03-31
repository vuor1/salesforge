'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const translations = {
  fi: {
    title: 'SalesForge',
    email: 'Sähköposti',
    password: 'Salasana',
    submit: 'Kirjaudu sisään',
    loading: 'Kirjaudutaan...',
    error: 'Virheellinen sähköposti tai salasana',
    langSwitch: 'In English',
  },
  en: {
    title: 'SalesForge',
    email: 'Email',
    password: 'Password',
    submit: 'Log in',
    loading: 'Logging in...',
    error: 'Invalid email or password',
    langSwitch: 'Suomeksi',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('fi')

  const t = translations[lang]

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.target)
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError(t.error)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <button
            type="button"
            onClick={() => setLang(lang === 'fi' ? 'en' : 'fi')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t.langSwitch}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
