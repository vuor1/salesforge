'use client'

import { useState } from 'react'

const CATEGORIES = ['raha', 'mindset', 'myynti', 'elämäntaidot', 'suhteet']

const EMPTY_FORM = { title: '', category: 'myynti', content: '', sessionDate: '' }

function highlight(text, term) {
  if (!term) return text
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded-sm">{part}</mark>
      : part
  )
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

export default function GrowthClubClient({ initialSessions, isAdmin, categoryLabels, initialTopicRequests = [] }) {
  const [sessions, setSessions] = useState(initialSessions)
  const [activeCategory, setActiveCategory] = useState(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [question, setQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState(null)
  const [aiAsking, setAiAsking] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [topicRequests, setTopicRequests] = useState(initialTopicRequests)
  const [topicContent, setTopicContent] = useState('')
  const [topicSubmitting, setTopicSubmitting] = useState(false)
  const [topicSubmitted, setTopicSubmitted] = useState(false)
  const [showTopicForm, setShowTopicForm] = useState(false)

  const filtered = sessions.filter((s) => {
    const matchesCategory = !activeCategory || s.category === activeCategory
    if (!matchesCategory) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
  })

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const res = await fetch('/api/growth-club', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setFormError(json.error?.message ?? 'Tallennus epäonnistui')
      return
    }

    const json = await res.json()
    setSessions((prev) => [json.data, ...prev])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  async function handleAsk(e) {
    e.preventDefault()
    setAiAsking(true)
    setAiAnswer(null)
    setAiError(null)

    const res = await fetch('/api/growth-club/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })

    setAiAsking(false)

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setAiError(
        res.status === 503
          ? 'AI ei ole tällä hetkellä saatavilla. Yritä myöhemmin uudelleen.'
          : json.error?.message ?? 'Haku epäonnistui'
      )
      return
    }

    setAiAnswer(json.data.answer)
  }

  async function handleTopicSubmit(e) {
    e.preventDefault()
    setTopicSubmitting(true)
    const res = await fetch('/api/growth-club/topic-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: topicContent }),
    })
    setTopicSubmitting(false)
    if (!res.ok) return
    const json = await res.json()
    setTopicRequests((prev) => [json.data, ...prev])
    setTopicContent('')
    setShowTopicForm(false)
    setTopicSubmitted(true)
    setTimeout(() => setTopicSubmitted(false), 4000)
  }

  async function handleTopicDone(id) {
    const res = await fetch(`/api/growth-club/topic-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    })
    if (res.ok) {
      setTopicRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'done' } : r))
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/growth-club/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (expanded === id) setExpanded(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search + category filters */}
      <div className="space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hae sessioista..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              activeCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Kaikki
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Admin: add session */}
      {isAdmin && (
        <div>
          {showForm ? (
            <form
              onSubmit={handleAdd}
              className="bg-white rounded-lg border border-blue-200 p-4 space-y-3"
            >
              <h3 className="font-semibold text-gray-900">Lisää sessio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Otsikko <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Esim. Rahan psykologia myyntityössä"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kategoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Päivämäärä <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.sessionDate}
                    onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sisältö / litteraatti <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={8}
                  placeholder="Liitä tähän session litteraatti tai muistiinpanot..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-y"
                />
              </div>
              {formError && <p className="text-red-600 text-sm">{formError}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Tallennetaan...' : 'Tallenna sessio'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null) }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  Peruuta
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50"
            >
              + Lisää sessio
            </button>
          )}
        </div>
      )}

      {/* Search result count */}
      {query.trim() && (
        <p className="text-sm text-gray-500">
          {filtered.length === 0
            ? 'Ei hakutuloksia.'
            : `${filtered.length} sessio${filtered.length !== 1 ? 'ta' : ''} löytyi`}
        </p>
      )}

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-400">
            {query.trim()
              ? `Ei hakutuloksia haulle "${query}".`
              : activeCategory
              ? `Ei sessioita kategoriassa "${categoryLabels[activeCategory]}".`
              : 'Ei vielä Growth Club -sessioita.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((session) => (
            <li key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === session.id ? null : session.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded shrink-0">
                    {categoryLabels[session.category] ?? session.category}
                  </span>
                  <span className="font-medium text-gray-900 truncate">
                    {highlight(session.title, query)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-xs text-gray-400">{formatDate(session.sessionDate)}</span>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(session.id) }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Poista
                    </button>
                  )}
                  <span className="text-gray-400 text-sm">{expanded === session.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded === session.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {highlight(session.content, query)}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {/* Topic request */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Ehdota aihetta tulevaan sessioon</h3>
          {!showTopicForm && (
            <button
              onClick={() => setShowTopicForm(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              + Ehdota
            </button>
          )}
        </div>

        {topicSubmitted && (
          <p className="text-sm text-green-700">✓ Aihe-ehdotus lähetetty!</p>
        )}

        {showTopicForm && (
          <form onSubmit={handleTopicSubmit} className="flex gap-2">
            <input
              value={topicContent}
              onChange={(e) => setTopicContent(e.target.value)}
              placeholder="Esim. Vastalauseiden käsittely päättäjien kanssa"
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={topicSubmitting || !topicContent.trim()}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 shrink-0"
            >
              {topicSubmitting ? 'Lähetetään...' : 'Lähetä'}
            </button>
            <button
              type="button"
              onClick={() => { setShowTopicForm(false); setTopicContent('') }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Peruuta
            </button>
          </form>
        )}

        {isAdmin && topicRequests.length > 0 && (
          <ul className="space-y-2 pt-1">
            {topicRequests.map((req) => (
              <li key={req.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className={req.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}>
                    {req.content}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {req.user?.name ?? req.user?.email?.split('@')[0]} · {formatDate(req.createdAt)}
                  </span>
                </div>
                {req.status === 'pending' && (
                  <button
                    onClick={() => handleTopicDone(req.id)}
                    className="text-xs text-green-600 hover:underline shrink-0"
                  >
                    Merkitse käsitellyksi
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Q&A */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Kysy AI:lta Growth Club -sisällöistä</h3>
          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Esim. Mitä Growth Clubissa on sanottu rahasta?"
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={aiAsking || !question.trim()}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 shrink-0"
            >
              {aiAsking ? 'Haetaan...' : 'Kysy'}
            </button>
          </form>
          {aiError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">{aiError}</p>
            </div>
          )}
          {aiAnswer && (
            <div className="bg-blue-50 border border-blue-100 rounded p-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{aiAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
