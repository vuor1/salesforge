'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

function useDebounce(fn, delay) {
  const timerRef = useRef(null)
  return useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  )
}

export default function CallScriptBuilderPage() {
  const router = useRouter()
  const { id } = useParams()

  const [project, setProject] = useState(null)
  const [teamScripts, setTeamScripts] = useState([])
  const [scriptId, setScriptId] = useState(null)
  const [title, setTitle] = useState('')
  const [opening, setOpening] = useState('')
  const [objections, setObjections] = useState('')
  const [closing, setClosing] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const [feedback, setFeedback] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)

  const [openingSuggestions, setOpeningSuggestions] = useState([])
  const [openingSuggestLoading, setOpeningSuggestLoading] = useState(false)
  const [openingSuggestError, setOpeningSuggestError] = useState(null)

  const [objectionSuggestion, setObjectionSuggestion] = useState(null)
  const [objectionSuggestLoading, setObjectionSuggestLoading] = useState(false)
  const [objectionSuggestError, setObjectionSuggestError] = useState(null)

  const scriptIdRef = useRef(null)

  useEffect(() => {
    scriptIdRef.current = scriptId
  }, [scriptId])

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/scripts`).then((r) => r.json()),
    ]).then(([projectRes, scriptsRes]) => {
      if (projectRes.data) setProject(projectRes.data)
      if (scriptsRes.data) {
        const saved = scriptsRes.data.filter((s) => s.status === 'saved')
        setTeamScripts(saved)
      }
      setLoaded(true)
    })
  }, [id])

  const autoSave = useCallback(
    async (fields) => {
      setSaveStatus('saving')
      try {
        const currentScriptId = scriptIdRef.current
        if (!currentScriptId) {
          const res = await fetch(`/api/projects/${id}/scripts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...fields, status: 'draft' }),
          })
          if (res.ok) {
            const json = await res.json()
            setScriptId(json.data.id)
            scriptIdRef.current = json.data.id
            setSaveStatus('saved')
          } else {
            setSaveStatus('error')
          }
        } else {
          const res = await fetch(`/api/projects/${id}/scripts/${currentScriptId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
          })
          setSaveStatus(res.ok ? 'saved' : 'error')
        }
      } catch {
        setSaveStatus('error')
      }
    },
    [id]
  )

  const debouncedAutoSave = useDebounce(autoSave, 1500)

  function handleChange(field, value) {
    const updates = { title, opening, objections, closing, [field]: value }
    if (field === 'title') setTitle(value)
    if (field === 'opening') setOpening(value)
    if (field === 'objections') setObjections(value)
    if (field === 'closing') setClosing(value)
    setSaveStatus('idle')
    debouncedAutoSave(updates)
  }

  async function ensureScriptSaved() {
    const currentScriptId = scriptIdRef.current
    if (currentScriptId) return currentScriptId
    const res = await fetch(`/api/projects/${id}/scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, opening, objections, closing, status: 'draft' }),
    })
    if (!res.ok) return null
    const json = await res.json()
    setScriptId(json.data.id)
    scriptIdRef.current = json.data.id
    return json.data.id
  }

  async function handleSave() {
    setSaving(true)
    try {
      const fields = { title, opening, objections, closing, status: 'saved' }
      const currentScriptId = scriptIdRef.current
      if (!currentScriptId) {
        const res = await fetch(`/api/projects/${id}/scripts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        })
        if (res.ok) {
          const json = await res.json()
          setScriptId(json.data.id)
          scriptIdRef.current = json.data.id
        }
      } else {
        await fetch(`/api/projects/${id}/scripts/${currentScriptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        })
      }
      setSaveStatus('saved')
      router.push(`/projects/${id}`)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleRequestFeedback() {
    setFeedbackLoading(true)
    setFeedbackError(null)
    setFeedback(null)
    const sid = await ensureScriptSaved()
    if (!sid) {
      setFeedbackError('Skriptin tallennus epäonnistui — yritä uudelleen.')
      setFeedbackLoading(false)
      return
    }
    const res = await fetch(`/api/projects/${id}/scripts/${sid}/feedback`, { method: 'POST' })
    setFeedbackLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setFeedbackError(
        json.error?.code === 'AI_UNAVAILABLE'
          ? 'AI-palvelu ei ole juuri nyt saatavilla. Voit silti tallentaa ja käyttää skriptiäsi.'
          : (json.error?.message ?? 'Palautteen haku epäonnistui.')
      )
      return
    }
    const json = await res.json()
    setFeedback(json.data.feedback)
  }

  async function handleSuggestOpening() {
    setOpeningSuggestLoading(true)
    setOpeningSuggestError(null)
    setOpeningSuggestions([])
    const res = await fetch(`/api/projects/${id}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'opening' }),
    })
    setOpeningSuggestLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setOpeningSuggestError(
        json.error?.code === 'AI_UNAVAILABLE'
          ? 'AI ei ole saatavilla juuri nyt.'
          : (json.error?.message ?? 'Ehdotusten haku epäonnistui.')
      )
      return
    }
    const json = await res.json()
    setOpeningSuggestions(json.data.suggestions ?? [])
  }

  async function handleSuggestObjection() {
    setObjectionSuggestLoading(true)
    setObjectionSuggestError(null)
    setObjectionSuggestion(null)
    const res = await fetch(`/api/projects/${id}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'objection', context: objections.trim() || undefined }),
    })
    setObjectionSuggestLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setObjectionSuggestError(
        json.error?.code === 'AI_UNAVAILABLE'
          ? 'AI ei ole saatavilla juuri nyt.'
          : (json.error?.message ?? 'Ehdotuksen haku epäonnistui.')
      )
      return
    }
    const json = await res.json()
    setObjectionSuggestion(json.data.suggestion ?? null)
  }

  function appendToOpening(text) {
    const updated = opening ? `${opening}\n\n${text}` : text
    setOpening(updated)
    handleChange('opening', updated)
  }

  function appendToObjections(text) {
    const updated = objections ? `${objections}\n\n${text}` : text
    setObjections(updated)
    handleChange('objections', updated)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Ladataan...</p>
      </div>
    )
  }

  const hasContent = opening.trim() || objections.trim() || closing.trim()

  const saveStatusText = {
    idle: null,
    saving: 'Tallennetaan luonnosta...',
    saved: 'Luonnos tallennettu',
    error: 'Automaattitallennus epäonnistui',
  }[saveStatus]

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[18px] font-semibold text-gray-900">Soittorungon rakentaja</h1>
          {saveStatusText && (
            <span className={`text-xs ${saveStatus === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
              {saveStatusText}
            </span>
          )}
        </div>
        <div className="flex gap-6">
          {/* Builder */}
          <div className="flex-1 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Otsikko (valinnainen)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="esim. Avaus + budjettikysymys"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Opening section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-800">1. Avaus</label>
                  <button
                    onClick={handleSuggestOpening}
                    disabled={openingSuggestLoading}
                    className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50"
                  >
                    {openingSuggestLoading ? 'Haetaan...' : 'AI ehdottaa avauslauseita'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">Miten avaat puhelun? Mikä on ensimmäinen lause?</p>
                <textarea
                  value={opening}
                  onChange={(e) => handleChange('opening', e.target.value)}
                  rows={5}
                  placeholder="Hei, olen [nimi] Strongest Groupilta. Soitan, koska..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
                {openingSuggestError && (
                  <p className="text-xs text-yellow-700 mt-1">{openingSuggestError}</p>
                )}
                {openingSuggestions.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-medium text-gray-500">Valitse ehdotus:</p>
                    {openingSuggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 bg-purple-50 rounded p-2">
                        <p className="text-xs text-gray-700 flex-1">{s}</p>
                        <button
                          onClick={() => appendToOpening(s)}
                          className="shrink-0 text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Käytä
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Objections section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-800">2. Vastaväitteiden käsittely</label>
                  <button
                    onClick={handleSuggestObjection}
                    disabled={objectionSuggestLoading}
                    className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50"
                  >
                    {objectionSuggestLoading ? 'Haetaan...' : 'AI ehdottaa vastausta'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">Mitä vastaväitteitä odotat? Miten vastaat niihin?</p>
                <textarea
                  value={objections}
                  onChange={(e) => handleChange('objections', e.target.value)}
                  rows={5}
                  placeholder="Vastaväite: 'Ei kiinnosta'\nVastaus: ..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
                {objectionSuggestError && (
                  <p className="text-xs text-yellow-700 mt-1">{objectionSuggestError}</p>
                )}
                {objectionSuggestion && (
                  <div className="mt-2 flex items-start gap-2 bg-purple-50 rounded p-2">
                    <p className="text-xs text-gray-700 flex-1 whitespace-pre-wrap">{objectionSuggestion}</p>
                    <button
                      onClick={() => appendToObjections(objectionSuggestion)}
                      className="shrink-0 text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Käytä
                    </button>
                  </div>
                )}
              </div>

              {/* Closing section */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">3. Lopetus</label>
                <p className="text-xs text-gray-400 mb-2">Miten suljet puhelun? Mitä seuraava askel on?</p>
                <textarea
                  value={closing}
                  onChange={(e) => handleChange('closing', e.target.value)}
                  rows={4}
                  placeholder="Sovitaan tapaaminen ensi viikolle..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasContent}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Tallennetaan...' : 'Tallenna skripti'}
                </button>
                <button
                  onClick={handleRequestFeedback}
                  disabled={feedbackLoading || !hasContent}
                  className="border border-purple-500 text-purple-600 text-sm px-4 py-2 rounded hover:bg-purple-50 disabled:opacity-50"
                >
                  {feedbackLoading ? 'Haetaan palautetta...' : 'Pyydä AI-palaute'}
                </button>
                <Link
                  href={`/projects/${id}`}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  Peruuta
                </Link>
              </div>
            </div>

            {feedbackError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">{feedbackError}</p>
              </div>
            )}

            {feedback && (
              <div className="bg-white rounded-lg shadow-sm border border-purple-100 p-5">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3">AI-palaute</p>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{feedback}</div>
                <button
                  onClick={() => setFeedback(null)}
                  className="mt-4 text-xs text-gray-400 hover:text-gray-600"
                >
                  Sulje palaute
                </button>
              </div>
            )}
          </div>

          {/* Context sidebar */}
          <aside className="w-72 shrink-0 space-y-4">
            {project?.callAngle && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Soittokulma</p>
                <p className="text-sm text-blue-900">{project.callAngle}</p>
              </div>
            )}

            {teamScripts.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Tiimin skriptit ({teamScripts.length})
                </p>
                <ul className="space-y-3">
                  {teamScripts.map((s) => (
                    <li key={s.id} className="text-xs text-gray-700 border-l-2 border-gray-200 pl-3">
                      <p className="font-medium text-gray-800 mb-0.5">
                        {s.title ?? (s.user.name ?? s.user.email.split('@')[0])}
                      </p>
                      {s.opening && <p className="text-gray-500 line-clamp-2">{s.opening}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
                <p className="text-xs text-gray-400">Ei vielä tiimin skriptejä — ole ensimmäinen!</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
