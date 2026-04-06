'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/projects', label: 'Projektit' },
  { href: '/growth-club', label: 'Growth Club' },
  { href: '/linkedin-studio', label: 'LinkedIn Studio' },
]

export default function NavBar({ userInitials }) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/projects" className="text-[15px] font-medium tracking-tight shrink-0">
          Sales<span className="text-indigo-600">Forge</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
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
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] font-medium shrink-0 ml-2">
          {userInitials ?? 'OV'}
        </div>
      </div>
    </header>
  )
}
