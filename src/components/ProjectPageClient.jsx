'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PeerSupportSection from '@/components/PeerSupportSection'
import ScriptRow from '@/components/features/ScriptRow'
import { saveRecentProject } from '@/components/features/InstantSearchField'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  return new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function authorName(user) {
  return user.name ?? user.email.split('@')[0]
}

// ── Vinkit tab ────────────────────────────────────────────────────────────────

const TIP_TYPES = [
  { key: 'avaus', label: 'Avaus' },
  { key: 'vastalause', label: 'Vastalause' },
  { key: 'lähestymistapa', label: 'Lähestymistapa' },
  { key: 'clousaus', label: 'Clousaus' },
]

const TYPE_COLORS = {
  avaus: 'bg-indigo-100 text-indigo-700',
  vastalause: 'bg-rose-100 text-rose-700',
  lähestymistapa: 'bg-amber-100 text-amber-700',
  clousaus: 'bg-emerald-100 text-emerald-700',
}

function TipCard({ tip, currentUserId, onLike, onDelete }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[tip.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {TIP_TYPES.find((t) => t.key === tip.type)?.label ?? tip.type}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike(tip.id)}
            className={`flex items-center gap-1 text-[12px] transition-colors ${tip.likedByMe ? 'text-rose-500' : 'text-gray-300 hover:text-rose-400'}`}
          >
            ♥ {tip.likeCount}
          </button>
          {tip.user.id === currentUserId && (
            <button onClick={() => onDelete(tip.id)} className="text-[12px] text-gray-300 hover:text-red-400">
              ✕
            </button>
          )}
        </div>
      </div>
      <p className="text-[14px] text-gray-900 leading-relaxed">{tip.content}</p>
      <div className="bg-gray-50 rounded-xl px-4 py-2.5">
        <p className="text-[12px] text-gray-500 leading-relaxed">{tip.context}</p>
      </div>
      <p className="text-[11px] text-gray-400">{authorName(tip.user)} · {formatDate(tip.createdAt)}</p>
    </div>
  )
}

function VinkitTab({ projectId, initialTips, initialStories, currentUserId, canManage }) {
  const router = useRouter()
  const [tips, setTips] = useState(initialTips)
  const [stories, setStories] = useState(initialStories)
  const [activeType, setActiveType] = useState(null)
  const [showTipForm, setShowTipForm] = useState(false)
  const [showStoryForm, setShowStoryForm] = useState(false)
  const [tipType, setTipType] = useState('avaus')
  const [tipContent, setTipContent] = useState('')
  const [tipContext, setTipContext] = useState('')
  const [storyContent, setStoryContent] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredTips = activeType ? tips.filter((t) => t.type === activeType) : tips

  async function handleLike(tipId) {
    const res = await fetch(`/api/tips/${tipId}/like`, { method: 'POST' })
    if (res.ok) {
      const { data } = await res.json()
      setTips((prev) =>
        prev.map((t) => t.id === tipId ? { ...t, likeCount: data.likeCount, likedByMe: data.likedByMe } : t)
      )
    }
  }

  async function handleDeleteTip(tipId) {
    if (!confirm('Poistetaanko vinkki?')) return
    const res = await fetch(`/api/tips/${tipId}`, { method: 'DELETE' })
    if (res.ok) setTips((prev) => prev.filter((t) => t.id !== tipId))
  }

  async function handleAddTip(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: tipType, content: tipContent, context: tipContext, projectCardId: projectId }),
    })
    setSaving(false)
    if (res.ok) {
      const { data } = await res.json()
      setTips((prev) => [data, ...prev])
      setTipContent('')
      setTipContext('')
      setShowTipForm(false)
      toast.success('Vinkki lisätty')
    }
  }

  async function handleAddStory(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: storyContent }),
    })
    setSaving(false)
    if (res.ok) {
      const { data } = await res.json()
      setStories((prev) => [data, ...prev])
      setStoryContent('')
      setShowStoryForm(false)
      toast.success('Tarina lisätty')
    }
  }

  async function handleDeleteStory(storyId) {
    if (!confirm('Poistetaanko tarina?')) return
    const res = await fetch(`/api/projects/${projectId}/stories/${storyId}`, { method: 'DELETE' })
    if (res.ok) setStories((prev) => prev.filter((s) => s.id !== storyId))
  }

  return (
    <div className="space-y-8">

      {/* Vinkit */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Vinkit</h3>
          <button
            onClick={() => setShowTipForm((v) => !v)}
            className="text-[13px] px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700"
          >
            {showTipForm ? 'Peruuta' : '+ Lisää vinkki'}
          </button>
        </div>

        {showTipForm && (
          <form onSubmit={handleAddTip} className="bg-white rounded-2xl p-5 shadow-sm space-y-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              {TIP_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTipType(t.key)}
                  className={`text-[12px] px-3 py-1 rounded-full font-medium transition-colors ${
                    tipType === t.key ? TYPE_COLORS[t.key] : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              value={tipContent}
              onChange={(e) => setTipContent(e.target.value)}
              placeholder="Vinkki — mitä teit tai sanoit"
              rows={3}
              required
              className="w-full text-[13px] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 resize-none"
            />
            <textarea
              value={tipContext}
              onChange={(e) => setTipContext(e.target.value)}
              placeholder="Missä tilanteessa toimi / miksi?"
              rows={2}
              required
              className="w-full text-[13px] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 resize-none"
            />
            <button
              type="submit"
              disabled={saving || !tipContent.trim() || !tipContext.trim()}
              className="text-[13px] px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Tallennetaan...' : 'Tallenna vinkki'}
            </button>
          </form>
        )}

        {/* Type filter */}
        {tips.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveType(null)}
              className={`text-[12px] px-3 py-1 rounded-full transition-colors ${activeType === null ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              Kaikki ({tips.length})
            </button>
            {TIP_TYPES.map((t) => {
              const count = tips.filter((tip) => tip.type === t.key).length
              if (count === 0) return null
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveType(t.key)}
                  className={`text-[12px] px-3 py-1 rounded-full transition-colors ${activeType === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                >
                  {t.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {filteredTips.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-[14px] text-gray-400">Ei vinkkejä vielä — ole ensimmäinen!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTips.map((tip) => (
              <TipCard key={tip.id} tip={tip} currentUserId={currentUserId} onLike={handleLike} onDelete={handleDeleteTip} />
            ))}
          </div>
        )}
      </section>

      {/* Soittotarinat */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Soittotarinat</h3>
          <button
            onClick={() => setShowStoryForm((v) => !v)}
            className="text-[13px] px-3 py-1.5 rounded-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            {showStoryForm ? 'Peruuta' : '+ Lisää tarina'}
          </button>
        </div>

        {showStoryForm && (
          <form onSubmit={handleAddStory} className="bg-white rounded-2xl p-5 shadow-sm space-y-3 mb-4">
            <textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              placeholder="Kerro kokemuksesi: miten soitto meni, mitä opit, mihin kannattaa kiinnittää huomiota..."
              rows={5}
              required
              className="w-full text-[13px] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 resize-none"
            />
            <button
              type="submit"
              disabled={saving || !storyContent.trim()}
              className="text-[13px] px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Tallennetaan...' : 'Tallenna tarina'}
            </button>
          </form>
        )}

        {stories.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-[14px] text-gray-400">Ei soittotarinoita vielä</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {stories.map((story) => (
              <li key={story.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-gray-600">{authorName(story.user)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">{formatDate(story.createdAt)}</span>
                    {story.user.id === currentUserId && (
                      <button onClick={() => handleDeleteStory(story.id)} className="text-[12px] text-gray-300 hover:text-red-400">✕</button>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">{story.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// ── Soittorunko tab ───────────────────────────────────────────────────────────

function SoittorunkoTab({ projectId, initialScripts, currentUserId }) {
  const [scripts, setScripts] = useState(initialScripts ?? [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">
          {scripts.length === 0 ? 'Ei vielä tiimin soittorunkoja' : `${scripts.length} tiimin soittorunkoa`}
        </p>
        <Link
          href={`/projects/${projectId}/call-script`}
          className="text-[13px] px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700"
        >
          + Luo oma runko
        </Link>
      </div>

      {scripts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm space-y-3">
          <p className="text-[15px] text-gray-400">Tällä projektilla ei ole vielä soittorunkoja</p>
          <p className="text-[13px] text-gray-300">Ole ensimmäinen — luo runko ja jaa se tiimille!</p>
          <Link
            href={`/projects/${projectId}/call-script`}
            className="inline-block mt-2 text-[13px] px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700"
          >
            Luo soittorunko
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {scripts.map((script, i) => (
            <ScriptRow
              key={script.id}
              script={script}
              projectId={projectId}
              currentUserId={currentUserId}
              isHighlighted={i === 0 && script.reactionCount > 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Viestimallit tab ──────────────────────────────────────────────────────────

const CHANNELS = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'email', label: 'Sähköposti' },
  { key: 'sms', label: 'SMS/WhatsApp' },
  { key: 'phone', label: 'Puhelu' },
]

function ViestimalliCard({ template, canManage, projectId, onDelete }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(template.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-gray-900">{template.title}</p>
          <span className="text-[11px] text-gray-400 capitalize">{CHANNELS.find((c) => c.key === template.channel)?.label ?? template.channel}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleCopy} className="text-[12px] px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
            {copied ? 'Kopioitu ✓' : 'Kopioi'}
          </button>
          {canManage && (
            <button onClick={() => onDelete(template.id)} className="text-[12px] text-gray-300 hover:text-red-400">✕</button>
          )}
        </div>
      </div>
      <p className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-4">{template.body}</p>
    </div>
  )
}

function ViestimalliTab({ projectId, initialTemplates, canManage }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [activeChannel, setActiveChannel] = useState('linkedin')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState('linkedin')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = templates.filter((t) => t.channel === activeChannel)
  const counts = CHANNELS.reduce((acc, c) => ({ ...acc, [c.key]: templates.filter((t) => t.channel === c.key).length }), {})

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, channel, body, projectCardId: projectId }),
    })
    setSaving(false)
    if (res.ok) {
      const { data } = await res.json()
      setTemplates((prev) => [...prev, data])
      setTitle('')
      setBody('')
      setShowForm(false)
      setActiveChannel(channel)
      toast.success('Malli lisätty')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Poistetaanko malli?')) return
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-[13px] px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700"
          >
            {showForm ? 'Peruuta' : '+ Uusi malli'}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-gray-500 mb-1">Otsikko *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-[13px] px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1">Kanava *</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full text-[13px] px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
              >
                {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Malliteksti... käytä [hakasulkuja] muokattaville kohdille"
            rows={6}
            required
            className="w-full text-[13px] px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 resize-none"
          />
          <button
            type="submit"
            disabled={saving || !title.trim() || !body.trim()}
            className="text-[13px] px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Luodaan...' : 'Luo malli'}
          </button>
        </form>
      )}

      {/* Channel tabs */}
      <div className="flex gap-1">
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveChannel(c.key)}
            className={`text-[13px] px-3 py-1.5 rounded-full transition-colors ${
              activeChannel === c.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {c.label} {counts[c.key] > 0 && <span className="text-[11px] opacity-70">({counts[c.key]})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-[14px] text-gray-400">Ei malleja tällä kanavalla</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <ViestimalliCard key={t.id} template={t} canManage={canManage} projectId={projectId} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = [
  { key: 'vinkit', label: 'Vinkit' },
  { key: 'soittorunko', label: 'Soittorunko' },
  { key: 'viestimallit', label: 'Viestimallit' },
  { key: 'vertaistuki', label: 'Vertaistuki' },
]

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

export default function ProjectPageClient({ project, initialTips, initialStories, initialTemplates, initialScripts, currentUserId, canManage }) {
  const [activeTab, setActiveTab] = useState('vinkit')

  useEffect(() => {
    saveRecentProject({ id: project.id, name: project.name, industry: project.industry })
  }, [project.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">

      {/* Project header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-[13px] font-bold shrink-0">
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-gray-900">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${industryColor(project.industry)}`}>
              {project.industry}
            </span>
            {project.callAngle && (
              <span className="text-[12px] text-gray-400 truncate">{project.callAngle}</span>
            )}
          </div>
        </div>
        <Link href="/projects" className="text-[13px] text-gray-400 hover:text-gray-600 shrink-0">
          ← Projektit
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-[13px] py-2 rounded-xl font-medium transition-colors ${
              activeTab === tab.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'vinkit' && (
        <VinkitTab
          projectId={project.id}
          initialTips={initialTips}
          initialStories={initialStories}
          currentUserId={currentUserId}
          canManage={canManage}
        />
      )}
      {activeTab === 'soittorunko' && (
        <SoittorunkoTab
          projectId={project.id}
          initialScripts={initialScripts}
          currentUserId={currentUserId}
        />
      )}
      {activeTab === 'viestimallit' && (
        <ViestimalliTab
          projectId={project.id}
          initialTemplates={initialTemplates}
          canManage={canManage}
        />
      )}
      {activeTab === 'vertaistuki' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <PeerSupportSection projectId={project.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}
