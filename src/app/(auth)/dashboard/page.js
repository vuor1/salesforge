import { auth } from '@/auth'
import { signOut } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">SalesForge</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name ?? session?.user?.email}</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{session?.user?.role}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-800">
                Kirjaudu ulos
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Tervetuloa, {session?.user?.name ?? session?.user?.email}!</p>
      </main>
    </div>
  )
}
