'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PREFS_KEY = 'userPreferences'
const MAX_RECENT = 3

function getRecentProjects() {
  if (typeof window === 'undefined') return []
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    return Array.isArray(prefs.recentProjects) ? prefs.recentProjects : []
  } catch { return [] }
}

export function saveRecentProject(project) {
  if (typeof window === 'undefined') return
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    const existing = Array.isArray(prefs.recentProjects) ? prefs.recentProjects : []
    const filtered = existing.filter((p) => p.id !== project.id)
    const next = [{ id: project.id, name: project.name, industry: project.industry }, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, recentProjects: next }))
  } catch {}
}

function highlight(text, query) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

function ProjectListItem({ project, isActive, query, onClick }) {
  return (
    <li
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-colors ${
        isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
      }`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
        isActive ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
      }`}>
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
          {highlight(project.name, query)}
        </p>
        <p className={`text-[11px] truncate ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
          {project.industry}
        </p>
      </div>
      {project.storyCount !== undefined && (
        <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
          project.storyCount === 0
            ? isActive ? 'bg-amber-400 text-gray-900' : 'bg-amber-100 text-amber-700'
            : isActive ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-500'
        }`}>
          {project.storyCount === 0 ? 'Ensimmäinen!' : `${project.storyCount} tarinaa`}
        </span>
      )}
    </li>
  )
}

export default function InstantSearchField({ placeholder = 'Hae projekti...', className = '' }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null = not searched yet
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const [recentProjects, setRecentProjects] = useState([])
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceRef = useRef(null)
  const listboxId = 'instant-search-listbox'

  useEffect(() => {
    setRecentProjects(getRecentProjects())
  }, [])

  const search = useCallback(async (q) => {
    if (q.length < 3) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/projects?search=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)
    setOpen(true)
    clearTimeout(debounceRef.current)
    if (val.length < 3) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => search(val), 150)
  }

  function handleFocus() {
    setOpen(true)
    setRecentProjects(getRecentProjects())
  }

  function handleBlur(e) {
    // Delay closing so clicks on list items register
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }, 150)
  }

  const displayItems = query.length >= 3 ? (results ?? []) : recentProjects

  function navigateTo(project) {
    saveRecentProject(project)
    setOpen(false)
    setQuery('')
    setResults(null)
    router.push(`/projects/${project.id}`)
  }

  function handleKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, displayItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && displayItems[activeIndex]) {
        navigateTo(displayItems[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  const showDropdown = open && (query.length >= 3 ? true : recentProjects.length > 0)
  const isSearching = query.length >= 3

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] pointer-events-none">
          {loading ? '⟳' : '⌕'}
        </span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 text-[14px] rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-orange-200 focus-visible:outline-2 focus-visible:outline-orange-500"
        />
      </div>

      {showDropdown && (
        <div
          ref={listRef}
          className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
        >
          {!isSearching && recentProjects.length > 0 && (
            <p className="text-[11px] text-gray-400 px-3 pt-2.5 pb-1 font-medium uppercase tracking-wide">
              Viimeisimmät
            </p>
          )}

          {isSearching && results !== null && results.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-[13px] text-gray-500 mb-2">Ei tuloksia haulle "{query}"</p>
              <a
                href="/projects"
                className="text-[12px] text-indigo-600 hover:text-indigo-800 underline"
              >
                Pyydä neuvoa kollegalta
              </a>
            </div>
          )}

          {displayItems.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Hakutulokset"
              className="py-1.5 px-1.5 space-y-0.5"
            >
              {displayItems.map((project, i) => (
                <ProjectListItem
                  key={project.id}
                  id={`search-item-${i}`}
                  project={project}
                  isActive={i === activeIndex}
                  query={isSearching ? query : ''}
                  onClick={() => navigateTo(project)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
