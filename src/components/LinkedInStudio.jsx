'use client'

import { useState } from 'react'

const THEMES = [
  { key: 'growth_club', label: 'Growth Club -oppi', description: 'Jaa oivallus tiimin sisäisestä sessiosta' },
  { key: 'own_experience', label: 'Oma kokemus', description: 'Kerro opettavaisesta tilanteesta työssä' },
  { key: 'sales_tip', label: 'Myyntivinkki', description: 'Konkreettinen neuvo myyntiammatilaiselle' },
  { key: 'mindset', label: 'Mindset', description: 'Ajatuksia asenteesta, kasvusta tai menestyksestä' },
]

const CONTEXT_PLACEHOLDERS = {
  growth_club: 'Esim. "Growth Clubissa puhuttiin siitä, miten raha on työkalu eikä tavoite. Toimitusjohtaja kertoi..."',
  own_experience: 'Esim. "Eilen soitto meni pieleen koska avasin väärällä kysymyksellä. Opin että..."',
  sales_tip: 'Esim. "Olen huomannut että kun aloitan soiton kysymyksellä X eikä Y, vastausprosentti nousee selvästi"',
  mindset: 'Esim. "Epäonnistuminen ei ole este, se on tietoa. Viime kuussa hylättiin 40 tarjousta, mutta..."',
}

export default function LinkedInStudio() {
  const [theme, setTheme] = useState('growth_club')
  const [context, setContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [post, setPost] = useState('')
  const [aiError, setAiError] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate(e) {
    e.preventDefault()
    setGenerating(true)
    setAiError(null)
    setPost('')
    setCopied(false)

    const res = await fetch('/api/linkedin/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme, context }),
    })

    setGenerating(false)

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setAiError(
        res.status === 503
          ? 'AI ei ole tällä hetkellä saatavilla. Yritä myöhemmin uudelleen.'
          : json.error?.message ?? 'Generointi epäonnistui'
      )
      return
    }

    setPost(json.data.post)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(post)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Valitse teema, kirjoita lyhyt konteksti — AI kirjoittaa LinkedIn-postauksen puolestasi.
      </p>

      {/* Theme selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTheme(t.key); setPost(''); setAiError(null) }}
            className={`text-left rounded-lg border p-3 transition-colors ${
              theme === t.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className={`text-sm font-medium ${theme === t.key ? 'text-blue-700' : 'text-gray-900'}`}>
              {t.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Context input */}
      <form onSubmit={handleGenerate} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konteksti <span className="text-red-500">*</span>
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            placeholder={CONTEXT_PLACEHOLDERS[theme]}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={generating || !context.trim()}
          className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generoidaan...' : 'Generoi postaus'}
        </button>
      </form>

      {/* AI error */}
      {aiError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">{aiError}</p>
        </div>
      )}

      {/* Generated post */}
      {post && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Generoitu postaus</h2>
            <button
              onClick={handleCopy}
              className="text-sm text-blue-600 hover:underline"
            >
              {copied ? '✓ Kopioitu!' : 'Kopioi leikepöydälle'}
            </button>
          </div>
          <textarea
            value={post}
            onChange={(e) => setPost(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none resize-y"
          />
          <p className="text-xs text-gray-400">
            Voit muokata tekstiä ennen kopiointia.
          </p>
        </div>
      )}
    </div>
  )
}
