'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditStoryPage() {
  const router = useRouter()
  const { id, storyId } = useParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [initialLoaded, setInitialLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const story = json.data?.callStories?.find((s) => s.id === storyId)
        if (story) {
          setContent(story.content)
          setInitialLoaded(true)
        }
      })
  }, [id, storyId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    const res = await fetch(`/api/projects/${id}/stories/${storyId}`, {
      method: 'PATCH',
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

  async function handleDelete() {
    if (!confirm('Haluatko varmasti poistaa tämän soittotarinan?')) return

    setDeleting(true)

    const res = await fetch(`/api/projects/${id}/stories/${storyId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error?.message ?? 'Poisto epäonnistui')
      setDeleting(false)
      return
    }

    router.push(`/projects/${id}`)
    router.refresh()
  }

  if (!initialLoaded) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Ladataan...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-[18px] font-semibold text-gray-900 mb-6">Muokkaa soittotarinaa</h1>
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Tallennetaan...' : 'Tallenna muutokset'}
              </button>
              <Link
                href={`/projects/${id}`}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Peruuta
              </Link>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {deleting ? 'Poistetaan...' : 'Poista tarina'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
