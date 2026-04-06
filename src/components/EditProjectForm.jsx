'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProjectForm({ project }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    industry: project.industry,
    callAngle: project.callAngle ?? '',
    callHistorySummary: project.callHistorySummary ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json()
      setError(json.error?.message ?? 'Tallennus epäonnistui')
      return
    }

    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gray-400 hover:text-gray-700 underline"
      >
        Muokkaa tietoja
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Toimiala</label>
        <input
          type="text"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          required
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Soittokulma</label>
        <input
          type="text"
          value={formData.callAngle}
          onChange={(e) => setFormData({ ...formData, callAngle: e.target.value })}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Soittohistoria</label>
        <textarea
          value={formData.callHistorySummary}
          onChange={(e) => setFormData({ ...formData, callHistorySummary: e.target.value })}
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Tallennetaan...' : 'Tallenna'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
        >
          Peruuta
        </button>
      </div>
    </form>
  )
}
