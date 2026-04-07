'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/projects', label: 'Projektit' },
  { href: '/growth-club', label: 'Growth Club' },
  { href: '/linkedin-studio', label: 'LinkedIn Studio' },
]

export default function NavBar({ userInitials, role }) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 h-16 shrink-0 flex items-center">
      <div className="w-full max-w-none px-4 flex items-center justify-between h-full">
        <Link
          href="/projects"
          className="text-[15px] font-semibold tracking-tight shrink-0"
          aria-label="SalesForge — etusivu"
        >
          Sales<span className="text-indigo-600">Forge</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Päänavigaatio">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
          {role === 'admin' && (
            <Link
              href="/admin"
              className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
              aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
            >
              Hallinta
            </Link>
          )}
        </nav>

        <div
          className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] font-semibold shrink-0 ml-2"
          aria-label={`Käyttäjä: ${userInitials}`}
        >
          {userInitials ?? 'OV'}
        </div>
      </div>
    </header>
  )
}
