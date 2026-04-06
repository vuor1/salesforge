'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const INDUSTRY_COLORS = {
  'IT': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  'Tele': { bg: 'bg-sky-50', text: 'text-sky-700' },
  'Terveys': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'Logistiikka': { bg: 'bg-amber-50', text: 'text-amber-700' },
  'default': { bg: 'bg-gray-100', text: 'text-gray-600' },
}

function getColor(industry = '') {
  const key = Object.keys(INDUSTRY_COLORS).find((k) =>
    industry.toLowerCase().includes(k.toLowerCase())
  )
  return INDUSTRY_COLORS[key ?? 'default']
}

function StoryBadge({ count }) {
  const label = count === 0 ? 'Ei tarinoita' : count === 1 ? '1 tarina' : `${count} tarinaa`
  const color = count === 0
    ? 'bg-gray-100 text-gray-400'
    : count >= 5
    ? 'bg-indigo-50 text-indigo-600'
    : 'bg-gray-100 text-gray-600'
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${color}`}>
      {label}
    </span>
  )
}

export default function ProjectSearch({ initialProjects, canManage }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState(initialProjects)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', industry: '', callAngle: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  function handleSearch(value) {
    setQuery(value)
    startTransition(async () => {
      const params = value.trim() ? `?search=${encodeURIComponent(value.trim())}` : ''
      const res = await fetch(`/api/projects${params}`)
      if (res.ok) {
        const json = await res.json()
        setProjects(json.data)
      }
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json()
      setFormError(json.error?.message ?? 'Tallennus epäonnistui')
      return
    }
    const json = await res.json()
    setShowForm(false)
    setFormData({ name: '', industry: '', callAngle: '' })
    router.push(`/projects/${json.data.id}`)
  }

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4.5"/><path d="M10 10l2.5 2.5"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Hae nimellä tai toimialalla..."
            className="w-full rounded-full border border-gray-200 bg-white pl-8 pr-4 py-2 text-[13px] focus:outline-none focus:border-gray-400 shadow-none"
          />
          {isPending && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
              Haetaan...
            </span>
          )}
        </div>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-[13px] font-medium px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
          >
            <span>+</span> Luo projekti
          </button>
        )}
      </div>

      {/* Uusi projekti -lomake */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-[13px] font-medium text-gray-900">Uusi projekti</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Nimi <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Toimiala <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Soittokulma</label>
            <input
              type="text"
              value={formData.callAngle}
              onChange={(e) => setFormData({ ...formData, callAngle: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-400"
            />
          </div>
          {formError && <p className="text-red-500 text-[13px]">{formError}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving || !formData.name.trim() || !formData.industry.trim()}
              className="bg-gray-900 text-white text-[13px] px-4 py-2 rounded-full hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              {saving ? 'Luodaan...' : 'Luo projekti'}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="text-[13px] text-gray-400 hover:text-gray-700 px-4 py-2"
            >
              Peruuta
            </button>
          </div>
        </div>
      )}

      {/* Projektilista */}
      {projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-[15px] font-medium">Ei hakutuloksia</p>
          <p className="text-[13px] mt-1">
            {query ? `Ei projekteja hakusanalla "${query}"` : 'Ei projekteja vielä'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => {
            const color = getColor(project.industry)
            const initials = project.name.slice(0, 2).toUpperCase()
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-300 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-medium ${color.bg} ${color.text}`}>
                    {initials}
                  </div>
                  <StoryBadge count={project.storyCount} />
                </div>
                <p className="text-[14px] font-medium text-gray-900 leading-snug mb-1">
                  {project.name}
                </p>
                <p className="text-[12px] text-gray-400">{project.industry}</p>
                {project.callAngle && (
                  <p className="text-[12px] text-gray-400 mt-3 line-clamp-2 leading-relaxed border-t border-gray-50 pt-3">
                    {project.callAngle}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
