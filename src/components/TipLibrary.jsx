'use client'

import { useState } from 'react'

const TYPES = ['avaus', 'vastalause', 'lähestymistapa', 'clousaus']

const TYPE_LABELS = {
  avaus: 'Avaus',
  vastalause: 'Vastalause',
  lähestymistapa: 'Lähestymistapa',
  clousaus: 'Clousaus',
}

const TYPE_COLORS = {
  avaus: 'bg-indigo-50 text-indigo-700',
  vastalause: 'bg-rose-50 text-rose-700',
  lähestymistapa: 'bg-amber-50 text-amber-700',
  clousaus: 'bg-emerald-50 text-emerald-700',
}

const EMPTY_FORM = { type: 'avaus', content: '', context: '', projectCardId: '' }

function authorName(user) {
  return user?.name ?? user?.email?.split('@')[0] ?? '?'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' })
}

export default function TipLibrary({ initialTips, projects, currentUserId }) {
  const [tips, setTips] = useState(initialTips)
  const [activeType, setActiveType] = useState(null)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const filtered = tips.filter((tip) => {
    if (activeType && tip.type !== activeType) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return tip.content.toLowerCase().includes(q) || tip.context.toLowerCase().includes(q)
  })

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const res = await fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, projectCardId: form.projectCardId || null }),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setFormError(json.error?.message ?? 'Tallennus epäonnistui')
      return
    }

    const json = await res.json()
    setTips((prev) => [json.data, ...prev])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  async function handleLike(id) {
    const res = await fetch(`/api/tips/${id}/like`, { method: 'POST' })
    if (!res.ok) return
    const json = await res.json()
    setTips((prev) => prev.map((t) => {
      if (t.id !== id) return t
      const liked = json.data.liked
      return { ...t, likedByMe: liked, likeCount: liked ? t.likeCount + 1 : t.likeCount - 1 }
    }))
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/tips/${id}`, { method: 'DELETE' })
    if (res.ok) setTips((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">Vinkkikirjasto</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Kollegoiden jakamia, tilanteeseen sidottuja buukkausvinkkejä</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-[13px] font-medium px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
          >
            + Jaa vinkki
          </button>
        )}
      </div>

      {/* Uusi vinkki -lomake */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-[13px] font-medium text-gray-900">Jaa vinkki</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`text-[12px] font-medium py-1.5 rounded-full border transition-colors ${
                  form.type === t
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">
              Vinkki <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
              placeholder={
                form.type === 'avaus' ? 'Esim. "Näin tein LinkedIn-löydöstä heti relevantin avauksen..."' :
                form.type === 'vastalause' ? 'Esim. "Kun asiakas sanoo ei nyt aikaa, kokeile..."' :
                form.type === 'lähestymistapa' ? 'Esim. "IT-päättäjille kannattaa aloittaa aina..."' :
                'Esim. "Tapaamisen lukitsemiseen toimii parhaiten..."'
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">
              Missä tilanteessa / miksi toimi <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.context}
              onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
              rows={2}
              placeholder='Esim. "Toimi erityisen hyvin kasvuyhtiöille, joiden toimitusjohtaja on LinkedInissä aktiivinen"'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Projekti (valinnainen)</label>
            <select
              value={form.projectCardId}
              onChange={(e) => setForm((f) => ({ ...f, projectCardId: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Ei projektisidontaa —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {formError && <p className="text-red-500 text-[13px]">{formError}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={saving || !form.content.trim() || !form.context.trim()}
              className="bg-gray-900 text-white text-[13px] px-4 py-2 rounded-full hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              {saving ? 'Tallennetaan...' : 'Jaa vinkki'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null) }}
              className="text-[13px] text-gray-400 hover:text-gray-700 px-4 py-2"
            >
              Peruuta
            </button>
          </div>
        </div>
      )}

      {/* Filtterit + haku */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4.5"/><path d="M10 10l2.5 2.5"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hae vinkeistä..."
            className="rounded-full border border-gray-200 bg-white pl-8 pr-4 py-1.5 text-[13px] focus:outline-none focus:border-gray-400 w-48"
          />
        </div>
        <button
          onClick={() => setActiveType(null)}
          className={`text-[12px] px-3 py-1.5 rounded-full font-medium transition-colors ${
            !activeType ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          Kaikki
        </button>
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(activeType === t ? null : t)}
            className={`text-[12px] px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeType === t ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
        <span className="text-[12px] text-gray-400 ml-auto">{filtered.length} vinkkiä</span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-[15px] font-medium">Ei vinkkejä</p>
          <p className="text-[13px] mt-1">
            {query ? `Ei tuloksia haulle "${query}"` : 'Ole ensimmäinen joka jakaa vinkin'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tip) => (
            <div key={tip.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[tip.type]}`}>
                      {TYPE_LABELS[tip.type]}
                    </span>
                    {tip.projectCard && (
                      <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                        {tip.projectCard.name}
                      </span>
                    )}
                  </div>

                  <p className="text-[14px] text-gray-900 leading-relaxed">{tip.content}</p>

                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-wide">Missä tilanteessa</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{tip.context}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[12px] text-gray-400">
                      {authorName(tip.user)} · {formatDate(tip.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleLike(tip.id)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
                      tip.likedByMe
                        ? 'text-indigo-600'
                        : 'text-gray-300 hover:text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill={tip.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                    </svg>
                    <span className="text-[11px] font-medium">{tip.likeCount || ''}</span>
                  </button>
                  {(tip.userId === currentUserId) && (
                    <button
                      onClick={() => handleDelete(tip.id)}
                      className="text-[11px] text-gray-200 hover:text-red-400 transition-colors px-2 py-1"
                    >
                      Poista
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
