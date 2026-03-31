'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'

export default function ProjectSearch({ initialProjects }) {
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState(initialProjects)
  const [isPending, startTransition] = useTransition()

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

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Hae projektin nimellä tai toimialalla..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 shadow-sm focus:border-blue-500 focus:outline-none text-sm"
          aria-label="Hae projekteja"
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Haetaan...
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">Ei hakutuloksia</p>
          <p className="text-sm mt-1">
            {query
              ? `Ei projekteja hakusanalla "${query}"`
              : 'Ei projekteja vielä'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 hover:border-blue-300 hover:shadow transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{project.industry}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4 mt-0.5">
                    {project.storyCount} {project.storyCount === 1 ? 'tarina' : 'tarinaa'}
                  </span>
                </div>
                {project.callAngle && (
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                    {project.callAngle}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
