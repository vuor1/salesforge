'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const INDUSTRY_COLORS = {
  IT: 'text-indigo-600',
  Tele: 'text-sky-600',
  Terveys: 'text-emerald-600',
  Logistiikka: 'text-amber-600',
}

function industryColor(industry) {
  for (const [key, cls] of Object.entries(INDUSTRY_COLORS)) {
    if (industry?.includes(key)) return cls
  }
  return 'text-gray-400'
}

export default function ProjectListPanel({ projects }) {
  const params = useParams()
  const activeId = params?.id ?? null
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.industry?.toLowerCase().includes(query.toLowerCase())
      )
    : projects

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-100 shrink-0">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suodata projektit…"
          aria-label="Suodata projektilista"
          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* List */}
      <nav aria-label="Projektit" className="flex-1 overflow-y-auto py-1.5">
        {filtered.length === 0 ? (
          <p className="text-[12px] text-gray-400 px-4 py-3">Ei tuloksia</p>
        ) : (
          <ul role="list">
            {filtered.map((project) => {
              const isActive = project.id === activeId
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2.5 mx-1.5 rounded-lg transition-colors group ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      isActive ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {project.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Name + industry */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {project.name}
                      </p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-gray-300' : industryColor(project.industry)}`}>
                        {project.industry}
                      </p>
                    </div>

                    {/* Story count badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                      project.storyCount === 0
                        ? isActive
                          ? 'bg-amber-400 text-gray-900'
                          : 'bg-amber-100 text-amber-700'
                        : isActive
                          ? 'bg-gray-700 text-gray-200'
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      {project.storyCount === 0 ? '0' : project.storyCount}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
        <p className="text-[10px] text-gray-300 text-center">{projects.length} projektia</p>
      </div>
    </div>
  )
}
