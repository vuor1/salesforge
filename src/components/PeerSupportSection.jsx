'use client'

import { useState, useEffect } from 'react'

const ADVICE_TYPE_LABELS = {
  soittorunko: 'Soittorunko',
  viestimalli: 'Viestimalli',
  yleinen: 'Yleinen neuvo',
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function authorName(user) {
  return user.name ?? user.email.split('@')[0]
}

function AnswerForm({ projectId, requestId, onAnswered }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch(`/api/projects/${projectId}/peer-support/${requestId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error?.message ?? 'Lähetys epäonnistui')
      return
    }

    const json = await res.json()
    onAnswered(json.data)
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-3 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Kirjoita vastauksesi..."
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Lähetetään...' : 'Lähetä vastaus'}
      </button>
    </form>
  )
}

export default function PeerSupportSection({ projectId, currentUserId }) {
  const [requests, setRequests] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [adviceType, setAdviceType] = useState('yleinen')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [slackNotified, setSlackNotified] = useState(null)
  const [error, setError] = useState(null)
  const [answeringId, setAnsweringId] = useState(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/peer-support`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setRequests(json.data)
        setLoaded(true)
      })
  }, [projectId])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch(`/api/projects/${projectId}/peer-support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adviceType, description }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error?.message ?? 'Lähetys epäonnistui')
      return
    }

    const json = await res.json()
    setRequests((prev) => [json.data, ...prev])
    setShowForm(false)
    setDescription('')
    setAdviceType('yleinen')
    setSlackNotified(json.data?.slackNotified ?? null)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
  }

  function handleAnswered(requestId, newAnswer) {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: 'answered', answers: [...req.answers, newAnswer] }
          : req
      )
    )
    setAnsweringId(null)
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Kolleganeuvo
          {pendingCount > 0 && (
            <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {pendingCount} odottaa vastausta
            </span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50"
          >
            Pyydä neuvoa
          </button>
        )}
      </div>

      {submitted && slackNotified === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✓ Neuvopyyntö lähetetty. Kollegasi on ilmoitettu.
          </p>
        </div>
      )}
      {submitted && slackNotified === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ✓ Neuvopyyntö lähetetty. Ilmoitus epäonnistui — kollegasi näkevät pyyntösi projektikorttisivulla.
          </p>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-blue-200 p-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mihin tarvitset neuvoa? <span className="text-red-500">*</span>
            </label>
            <select
              value={adviceType}
              onChange={(e) => setAdviceType(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {Object.entries(ADVICE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kuvaus (valinnainen)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mitä erityisesti haluaisit tietää?"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Lähetetään...' : 'Lähetä pyyntö'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Peruuta
            </button>
          </div>
        </form>
      )}

      {loaded && requests.length > 0 && (
        <ul className="space-y-3">
          {requests.map((req) => (
            <li
              key={req.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {ADVICE_TYPE_LABELS[req.adviceType] ?? req.adviceType}
                  </span>
                  {req.status === 'pending' ? (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Odottaa vastausta
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Vastattu
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(req.createdAt)}</span>
              </div>

              <p className="text-xs text-gray-500 mb-1">
                <span className="font-medium">{authorName(req.user)}</span> kysyi:
              </p>
              {req.description && (
                <p className="text-sm text-gray-800 mb-3">{req.description}</p>
              )}

              {req.answers.length > 0 && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {req.answers.map((answer) => (
                    <div key={answer.id} className="bg-green-50 rounded p-3">
                      <p className="text-xs text-green-700 font-medium mb-1">
                        {authorName(answer.user)} — {formatDate(answer.createdAt)}
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{answer.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {req.status === 'pending' && req.userId !== currentUserId && (
                answeringId === req.id ? (
                  <AnswerForm
                    projectId={projectId}
                    requestId={req.id}
                    onAnswered={(answer) => handleAnswered(req.id, answer)}
                  />
                ) : (
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={() => setAnsweringId(req.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Vastaa pyyntöön
                    </button>
                  </div>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      {loaded && requests.length === 0 && !showForm && (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-400">Ei vielä neuvopyyntöjä tässä projektissa.</p>
        </div>
      )}
    </div>
  )
}
