import { auth } from '@/auth'
import { signOut } from '@/auth'
import Link from 'next/link'

const navItems = [
  { href: '/projects', label: 'Projektit', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
  { href: '/call-scripts', label: 'Soittorungot', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
  { href: '/messages', label: 'Viestimallit', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
  { href: '/peer-support', label: 'Vertaistuki', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
  { href: '/admin', label: 'Hallinta', roles: ['admin'] },
]

export default async function DashboardPage() {
  const session = await auth()
  const role = session?.user?.role ?? 'sdr'

  const visibleNav = navItems.filter((item) => item.roles.includes(role))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">SalesForge</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name ?? session?.user?.email}</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
              {role}
            </span>
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
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 py-2">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Tervetuloa, {session?.user?.name ?? session?.user?.email}!</p>
      </main>
    </div>
  )
}
