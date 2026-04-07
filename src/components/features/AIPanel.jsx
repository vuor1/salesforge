'use client'

import { useState, useEffect, useRef } from 'react'

function SkeletonLine({ width = 'w-full' }) {
  return (
    <div className={`h-3 ${width} bg-indigo-100 rounded animate-pulse`} />
  )
}

function Skeleton() {
  return (
    <div className="space-y-2.5 py-1">
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-5/6" />
      <SkeletonLine width="w-4/5" />
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-3/4" />
    </div>
  )
}

function renderBullets(text) {
  // Split on lines, render bullet lines specially
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return null
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)
    const content = isBullet ? trimmed.replace(/^[•\-*]\s*|\d+\.\s*/, '') : trimmed
    if (isBullet) {
      return (
        <li key={i} className="flex gap-2 text-[13px] text-gray-700 leading-relaxed">
          <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
          <span>{content}</span>
        </li>
      )
    }
    return (
      <p key={i} className={`text-[12px] leading-relaxed ${trimmed.startsWith('Tämä perustuu') || trimmed.startsWith('Vastaukseni') ? 'text-indigo-400 italic mt-2' : 'text-gray-600'}`}>
        {trimmed}
      </p>
    )
  }).filter(Boolean)
}

export default function AIPanel({ projectId, embedded = false }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      const prefs = JSON.parse(localStorage.getItem('userPreferences') ?? '{}')
      return prefs.aiPanelOpen !== false
    } catch { return true }
  })
  const [synthesis, setSynthesis] = useState(null)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [conversation, setConversation] = useState([]) // [{role, text}]
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  function saveOpenPref(value) {
    try {
      const prefs = JSON.parse(localStorage.getItem('userPreferences') ?? '{}')
      localStorage.setItem('userPreferences', JSON.stringify({ ...prefs, aiPanelOpen: value }))
    } catch {}
  }

  function toggleOpen() {
    const next = !open
    setOpen(next)
    saveOpenPref(next)
  }

  useEffect(() => {
    if (!open || synthesis || loadingInitial) return
    setLoadingInitial(true)
    setError(null)
    fetch(`/api/projects/${projectId}/ai-synthesis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: null }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error.message)
        setSynthesis(json.data)
      })
      .catch(() => setError('AI ei saatavilla tällä hetkellä — selaa soittorungot manuaalisesti'))
      .finally(() => setLoadingInitial(false))
  }, [open, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAsk(e) {
    e.preventDefault()
    const q = question.trim()
    if (!q || asking) return
    setQuestion('')
    setAsking(true)
    setConversation((prev) => [...prev, { role: 'user', text: q }])

    try {
      const res = await fetch(`/api/projects/${projectId}/ai-synthesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setConversation((prev) => [...prev, { role: 'ai', text: json.data.text }])
    } catch {
      setConversation((prev) => [...prev, { role: 'ai', text: 'Virhe — yritä uudelleen.' }])
    } finally {
      setAsking(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  // When embedded in sidebar, render the body directly without the card wrapper/header
  if (embedded) {
    return (
      <div className="space-y-4 pt-1" aria-live="polite">
        {error ? (
          <p className="text-[12px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5">{error}</p>
        ) : loadingInitial ? (
          <Skeleton />
        ) : synthesis ? (
          <ul className="space-y-1">{renderBullets(synthesis.text)}</ul>
        ) : null}

        {conversation.length > 0 && (
          <div className="space-y-3 border-t border-indigo-100 pt-3" aria-live="polite">
            {conversation.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
                {msg.role === 'user' ? (
                  <span className="inline-block text-[11px] bg-indigo-600 text-white px-2.5 py-1.5 rounded-xl max-w-[90%] text-left">
                    {msg.text}
                  </span>
                ) : (
                  <ul className="space-y-1 text-left">{renderBullets(msg.text)}</ul>
                )}
              </div>
            ))}
            {asking && <p className="text-[11px] text-indigo-400 animate-pulse">Sparraaja miettii…</p>}
            <div ref={bottomRef} />
          </div>
        )}

        <form onSubmit={handleAsk} className="flex gap-1.5">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Kysy sparraajalta…"
            disabled={asking || loadingInitial}
            className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
            aria-label="Kysy AI-sparraajalta"
          />
          <button
            type="submit"
            disabled={!question.trim() || asking || loadingInitial}
            className="text-[12px] px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
            aria-label="Lähetä"
          >
            ↵
          </button>
        </form>
      </div>
    )
  }

  return (
    <div
      role="complementary"
      aria-label="AI-sparraaja"
      className="bg-indigo-50 border border-indigo-100 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[13px] font-semibold text-indigo-700">AI-sparraaja</span>
        </div>
        <button
          onClick={toggleOpen}
          className="text-[12px] text-indigo-400 hover:text-indigo-600 transition-colors px-2 py-0.5 rounded"
          aria-expanded={open}
          aria-controls="ai-panel-body"
        >
          {open ? 'Sulje ▲' : 'Avaa ▼'}
        </button>
      </div>

      {open && (
        <div id="ai-panel-body" className="px-4 py-4 space-y-4">

          {/* Synthesis section */}
          {error ? (
            <p className="text-[12px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5">{error}</p>
          ) : loadingInitial ? (
            <Skeleton />
          ) : synthesis ? (
            <div aria-live="polite">
              <ul className="space-y-1 mb-2">
                {renderBullets(synthesis.text)}
              </ul>
            </div>
          ) : null}

          {/* Conversation history */}
          {conversation.length > 0 && (
            <div className="space-y-3 border-t border-indigo-100 pt-3" aria-live="polite">
              {conversation.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
                  {msg.role === 'user' ? (
                    <span className="inline-block text-[12px] bg-indigo-600 text-white px-3 py-1.5 rounded-xl max-w-[85%] text-left">
                      {msg.text}
                    </span>
                  ) : (
                    <ul className="space-y-1 text-left">
                      {renderBullets(msg.text)}
                    </ul>
                  )}
                </div>
              ))}
              {asking && (
                <p className="text-[12px] text-indigo-400 animate-pulse">Sparraaja miettii…</p>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Question input */}
          <form onSubmit={handleAsk} className="flex gap-2 pt-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Kysy sparraajalta…"
              disabled={asking || loadingInitial}
              className="flex-1 text-[13px] px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:border-indigo-400 disabled:opacity-50"
              aria-label="Kysy AI-sparraajalta"
            />
            <button
              type="submit"
              disabled={!question.trim() || asking || loadingInitial}
              className="text-[13px] px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
              aria-label="Lähetä kysymys"
            >
              ↵
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
