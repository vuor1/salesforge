'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function AddStoryPage() {
  const router = useRouter()
  const { id } = useParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    const res = await fetch(`/api/projects/${id}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json()
      setError(json.error?.message ?? 'Tallennus epäonnistui')
      return
    }

    router.push(`/projects/${id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-[18px] font-semibold text-gray-900 mb-6">Lisää soittotarina</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Soittotarina
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
              placeholder="Kerro kokemuksesi tästä projektista: miten soitto meni, mitä opit, mihin kannattaa kiinnittää huomiota..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{content.length} merkkiä</p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Tallennetaan...' : 'Tallenna tarina'}
            </button>
            <Link
              href={`/projects/${id}`}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Peruuta
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
