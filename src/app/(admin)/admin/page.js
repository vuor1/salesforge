import { auth } from '@/auth'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">SalesForge — Admin</h1>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">
            ← Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Käyttäjähallinta</h2>
        <p className="text-gray-500 text-sm">
          Kirjautunut admin: {session?.user?.name ?? session?.user?.email}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Käyttäjähallinta toteutetaan Story 1.4:ssä.
        </p>
      </main>
    </div>
  )
}
