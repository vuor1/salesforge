'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import InstantSearchField from '@/components/features/InstantSearchField'

const INDUSTRY_COLORS = {
  IT: 'bg-indigo-100 text-indigo-700',
  Tele: 'bg-sky-100 text-sky-700',
  Terveys: 'bg-emerald-100 text-emerald-700',
  Logistiikka: 'bg-amber-100 text-amber-700',
}

function industryColor(industry) {
  for (const [key, cls] of Object.entries(INDUSTRY_COLORS)) {
    if (industry?.includes(key)) return cls
  }
  return 'bg-gray-100 text-gray-600'
}

function ProjectCard({ project, onRemove, removing }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm relative group">
      <button
        onClick={() => onRemove(project.id)}
        disabled={removing === project.id}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        title="Poista omista projekteista"
      >
        ✕
      </button>
      <Link href={`/projects/${project.id}`} className="flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-900 leading-tight">{project.name}</p>
            <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${industryColor(project.industry)}`}>
              {project.industry}
            </span>
          </div>
        </div>
        <div className="flex gap-4 text-[12px] text-gray-400">
          <span>{project.tipCount ?? 0} vinkkiä</span>
          <span>{project.storyCount ?? 0} tarinaa</span>
        </div>
      </Link>
    </div>
  )
}

function AddProjectPanel({ projects, onAdd, adding }) {
  const [search, setSearch] = useState('')
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Hae projektia..."
        className="w-full text-[13px] px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-gray-400"
      />
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {filtered.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50">
            <span className="text-[13px] text-gray-700">{p.name}</span>
            <button
              onClick={() => onAdd(p.id)}
              disabled={adding === p.id}
              className="text-[12px] font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              {adding === p.id ? '...' : '+ Lisää'}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-[12px] text-gray-400 px-2 py-2">Ei tuloksia</li>
        )}
      </ul>
    </div>
  )
}

function GrowthClubCard({ session }) {
  if (!session) return null

  const excerpt = session.content.length > 200
    ? session.content.slice(0, 200) + '...'
    : session.content

  return (
    <Link href="/growth-club" className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Growth Club</span>
        <span className="text-[11px] text-gray-400">
          {new Date(session.sessionDate).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <p className="text-[14px] font-semibold text-gray-900 mb-2">{session.title}</p>
      <p className="text-[13px] text-gray-500 leading-relaxed">{excerpt}</p>
      <p className="text-[12px] text-indigo-500 mt-3">Lue kaikki sessiot →</p>
    </Link>
  )
}

function LinkedInCard() {
  return (
    <Link href="/linkedin-studio" className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">LinkedIn Studio</span>
      </div>
      <p className="text-[14px] font-semibold text-gray-900 mb-2">Luo tämän viikon postaus</p>
      <p className="text-[13px] text-gray-500 leading-relaxed">
        Muunna soittokokemuksesi LinkedIn-sisällöksi. Valitse teema ja generoi postaus parissa minuutissa.
      </p>
      <p className="text-[12px] text-sky-500 mt-3">Avaa studio →</p>
    </Link>
  )
}

export default function HomeClient({ myProjects, otherProjects, latestSession, canManage }) {
  const router = useRouter()
  const [projects, setProjects] = useState(myProjects)
  const [available, setAvailable] = useState(otherProjects)
  const [removing, setRemoving] = useState(null)
  const [adding, setAdding] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  async function handleRemove(projectId) {
    setRemoving(projectId)
    await fetch(`/api/user/projects/${projectId}`, { method: 'DELETE' })
    const removed = projects.find((p) => p.id === projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    if (removed) setAvailable((prev) => [...prev, { id: removed.id, name: removed.name, industry: removed.industry }].sort((a, b) => a.name.localeCompare(b.name)))
    setRemoving(null)
  }

  async function handleAdd(projectId) {
    setAdding(projectId)
    const res = await fetch('/api/user/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectCardId: projectId }),
    })
    if (res.ok) {
      const added = available.find((p) => p.id === projectId)
      setAvailable((prev) => prev.filter((p) => p.id !== projectId))
      if (added) setProjects((prev) => [...prev, { ...added, tipCount: 0, storyCount: 0 }])
      if (available.length === 1) setShowAdd(false)
    }
    setAdding(null)
  }

  return (
    <div className="space-y-10">

      {/* Instant search */}
      <InstantSearchField
        placeholder="Hae projekti nimellä tai toimialalla..."
        className="max-w-lg"
      />

      {/* Omat projektit */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-gray-900">Omat projektit</h2>
          <div className="flex items-center gap-3">
            {canManage && (
              <Link
                href="/admin/projects/new"
                className="text-[13px] text-gray-400 hover:text-gray-700"
              >
                + Uusi projekti
              </Link>
            )}
            {available.length > 0 && (
              <button
                onClick={() => setShowAdd((v) => !v)}
                className="text-[13px] px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700"
              >
                {showAdd ? 'Sulje' : '+ Lisää projekti'}
              </button>
            )}
          </div>
        </div>

        {showAdd && (
          <div className="mb-4">
            <AddProjectPanel projects={available} onAdd={handleAdd} adding={adding} />
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-[14px] font-medium text-gray-500">Et ole valinnut projekteja vielä</p>
            <p className="text-[13px] text-gray-400 mt-1">Lisää projekteja listasta yllä</p>
            {available.length > 0 && !showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-4 text-[13px] px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700"
              >
                + Lisää projekti
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onRemove={handleRemove} removing={removing} />
            ))}
          </div>
        )}
      </section>

      {/* Growth Club + LinkedIn Studio */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GrowthClubCard session={latestSession} />
        <LinkedInCard />
      </section>

    </div>
  )
}
