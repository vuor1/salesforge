'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AIPanel from '@/components/features/AIPanel'

const PREFS_KEY = 'userPreferences'

function getAIPanelPref() {
  if (typeof window === 'undefined') return true
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    return prefs.aiPanelOpen !== false
  } catch { return true }
}

function saveAIPanelPref(value) {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, aiPanelOpen: value }))
  } catch {}
}

export default function AIPanelWrapper() {
  const params = useParams()
  const projectId = params?.id ?? null

  // Default: collapsed at <1280px, open at 1280px+
  const [open, setOpen] = useState(false) // start closed to avoid hydration flash

  useEffect(() => {
    const pref = getAIPanelPref()
    // At compact width (1024-1279), default to closed unless user explicitly opened
    const isCompact = window.innerWidth < 1280
    setOpen(isCompact ? (localStorage.getItem(PREFS_KEY) !== null ? pref : false) : pref)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    saveAIPanelPref(next)
  }

  // Don't render on list/dashboard pages — only on /projects/[id]
  if (!projectId) return null

  if (!open) {
    return (
      <div className="shrink-0 border-l border-gray-200 bg-white hidden lg:flex flex-col items-center pt-4 w-10">
        <button
          onClick={toggle}
          title="Avaa AI-sparraaja"
          aria-label="Avaa AI-sparraaja"
          aria-expanded={false}
          className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] hover:bg-indigo-100 transition-colors"
        >
          ✦
        </button>
      </div>
    )
  }

  return (
    <aside
      className="w-[240px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto hidden lg:block"
      aria-label="AI-sparraaja"
    >
      {/* Collapse button */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[11px] font-semibold text-indigo-600">AI-sparraaja</span>
        </div>
        <button
          onClick={toggle}
          title="Sulje AI-sparraaja"
          aria-label="Sulje AI-sparraaja"
          aria-expanded={true}
          className="text-[11px] text-gray-300 hover:text-gray-600 px-1"
        >
          ✕
        </button>
      </div>
      <div className="px-2 pb-4">
        <AIPanel projectId={projectId} embedded />
      </div>
    </aside>
  )
}
