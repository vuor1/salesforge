'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'

function formatDate(date) {
  return new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function authorName(user) {
  return user?.name ?? user?.email?.split('@')[0] ?? '—'
}

function StarScore({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange?.(n === value ? null : n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(null)}
          className={`text-[16px] transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${
            n <= (hovered ?? value ?? 0) ? 'text-amber-400' : 'text-gray-200'
          }`}
          aria-label={`${n} tähti`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ExperienceInline({ script, projectId, currentUserId, onSaved }) {
  const existing = script.myExperience
  const [content, setContent] = useState(existing?.content ?? '')
  const [score, setScore] = useState(existing?.score ?? null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const savedRef = useRef(false)

  async function handleBlur() {
    if (!content.trim() || savedRef.current) return
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: script.id, content: content.trim(), score }),
      })
      if (!res.ok) throw new Error('save failed')
      savedRef.current = true
      const { data } = await res.json()
      toast.success('Kokemuksesi on nyt kaikkien nähtävillä')
      onSaved?.(script.id, data)
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 bg-indigo-50 rounded-xl p-4 space-y-3 border border-indigo-100">
      <p className="text-[12px] font-medium text-indigo-700">Käytin tätä — miten meni?</p>
      {saveError && (
        <p className="text-[12px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          Yhteys katkeili — kokeillaan uudelleen…
        </p>
      )}
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); savedRef.current = false }}
        onBlur={handleBlur}
        placeholder="Miten meni? (max 280 merkkiä)"
        maxLength={280}
        rows={3}
        className="w-full text-[13px] px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:outline-none focus:border-indigo-400 resize-none"
      />
      <div className="flex items-center gap-3">
        <StarScore value={score} onChange={(v) => { setScore(v); savedRef.current = false }} />
        <span className="text-[11px] text-indigo-400">Pisteytys valinnainen</span>
        {saving && <span className="text-[11px] text-gray-400 ml-auto">Tallennetaan…</span>}
      </div>
    </div>
  )
}

export default function ScriptRow({ script, projectId, currentUserId, isHighlighted }) {
  const [expanded, setExpanded] = useState(false)
  const [showExperience, setShowExperience] = useState(false)
  const [copied, setCopied] = useState(false)
  const [experiences, setExperiences] = useState(script.experiences ?? [])

  const fullText = [script.opening, script.objections, script.closing]
    .filter(Boolean)
    .join('\n\n')

  const preview = fullText.slice(0, 120)
  const isTruncated = fullText.length > 120

  const scoredExperiences = experiences.filter((e) => e.score !== null && e.score !== undefined)
  const avgScore = scoredExperiences.length >= 3
    ? Math.round(experiences.filter(e => e.score).reduce((a, e) => a + e.score, 0) / scoredExperiences.length * 10) / 10
    : null

  function handleCopy() {
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    toast.success('Soittorunko kopioitu muokattavaksi ✓')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleExperienceSaved(scriptId, newExp) {
    setExperiences((prev) => {
      const exists = prev.find((e) => e.id === newExp.id)
      if (exists) return prev.map((e) => e.id === newExp.id ? newExp : e)
      return [...prev, newExp]
    })
    setShowExperience(false)
  }

  const myExperience = experiences.find((e) => e.authorId === currentUserId)
  const scriptWithExp = { ...script, myExperience }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isHighlighted
          ? 'border-amber-200 bg-amber-50'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-medium text-gray-600 shrink-0">
          {authorName(script.user).slice(0, 1).toUpperCase()}
        </div>

        {/* Content preview */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-medium text-gray-800 truncate">
              {script.title ?? authorName(script.user)}
            </span>
            {isHighlighted && (
              <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium shrink-0">
                Eniten reaktioita
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 line-clamp-1">
            {preview}{isTruncated && !expanded ? '…' : ''}
          </p>
        </button>

        {/* Meta */}
        <div className="flex items-center gap-3 shrink-0">
          {experiences.length > 0 && (
            <span className="text-[11px] text-gray-400">
              {experiences.length} kokem.{avgScore ? ` · ⭐ ${avgScore}` : ''}
            </span>
          )}
          <span className="text-[11px] text-gray-300">{formatDate(script.createdAt)}</span>

          {/* Action buttons */}
          <button
            onClick={handleCopy}
            title="Kopioi runko"
            className="text-[12px] text-gray-300 hover:text-gray-600 transition-colors"
          >
            {copied ? '✓' : '⎘'}
          </button>

          <button
            onClick={() => { setShowExperience((v) => !v); setExpanded(true) }}
            className="text-[12px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors font-medium"
          >
            {myExperience ? 'Muokkaa kokemusta' : 'Käytin tätä'}
          </button>
        </div>
      </div>

      {/* Expanded script text */}
      {expanded && fullText && (
        <div className="px-4 pb-3">
          <pre className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed font-sans bg-gray-50 rounded-lg px-4 py-3">
            {fullText}
          </pre>
        </div>
      )}

      {/* Experience inline form */}
      {showExperience && (
        <div className="px-4 pb-3">
          <ExperienceInline
            script={scriptWithExp}
            projectId={projectId}
            currentUserId={currentUserId}
            onSaved={handleExperienceSaved}
          />
        </div>
      )}
    </div>
  )
}
