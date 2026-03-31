'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

const ROLES = [
  { value: 'sdr', label: 'SDR' },
  { value: 'ae', label: 'Asiakasvastaava' },
  { value: 'team_lead', label: 'Tiiminvetäjä' },
  { value: 'admin', label: 'Admin' },
]

export default function AdminUserList({ users: initialUsers, currentUserId }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  async function createUser(data) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Virhe käyttäjän luomisessa')
        return
      }
      setUsers((prev) => [...prev, json.data])
      reset()
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  async function updateUser(id, patch) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error?.message ?? 'Päivitys epäonnistui')
      return
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? json.data : u)))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Käyttäjät ({users.length})
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
        >
          {showForm ? 'Peruuta' : '+ Lisää käyttäjä'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(createUser)}
          className="bg-white rounded-lg shadow p-4 space-y-3"
        >
          <h3 className="font-medium text-gray-900">Uusi käyttäjä</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sähköposti *</label>
              <input
                type="email"
                {...register('email', { required: true })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                placeholder="nimi@esimerkki.fi"
              />
              {errors.email && <p className="text-red-500 text-xs mt-0.5">Pakollinen kenttä</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nimi</label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Etunimi Sukunimi"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Salasana *</label>
              <input
                type="password"
                {...register('password', { required: true, minLength: 8 })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Vähintään 8 merkkiä"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-0.5">Vähintään 8 merkkiä</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rooli</label>
              <select
                {...register('role')}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kieli</label>
              <select
                {...register('language')}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="fi">Suomi</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Luodaan...' : 'Luo käyttäjä'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Nimi</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Sähköposti</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Rooli</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Toiminnot</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                <td className="px-4 py-2 text-gray-900">{user.name ?? '—'}</td>
                <td className="px-4 py-2 text-gray-600">{user.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, { role: e.target.value })}
                    className="rounded border border-gray-200 px-1.5 py-0.5 text-xs focus:outline-none"
                    disabled={user.id === currentUserId}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.isActive ? 'Aktiivinen' : 'Deaktivoitu'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                      className="text-xs text-gray-500 hover:text-gray-800 underline"
                    >
                      {user.isActive ? 'Deaktivoi' : 'Aktivoi'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
