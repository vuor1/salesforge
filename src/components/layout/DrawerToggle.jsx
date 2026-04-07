'use client'

import { useState } from 'react'
import ProjectListPanel from './ProjectListPanel'

export default function DrawerToggle({ projects }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Toggle button — only on mobile/tablet (<768px) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Avaa projektilista"
        aria-expanded={open}
        className="md:hidden fixed bottom-4 left-4 z-30 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors"
      >
        ☰
      </button>

      {/* Overlay backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Projektilista"
        aria-modal="true"
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-[280px] bg-white shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-[13px] font-semibold text-gray-900">Projektit</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Sulje projektilista"
            className="text-gray-400 hover:text-gray-700 w-7 h-7 flex items-center justify-center rounded"
          >
            ✕
          </button>
        </div>
        <div className="h-[calc(100%-52px)] overflow-hidden" onClick={() => setOpen(false)}>
          <ProjectListPanel projects={projects} />
        </div>
      </div>
    </>
  )
}
