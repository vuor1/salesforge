import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import Link from 'next/link'
import AdminUserList from './AdminUserList'

export default async function AdminPage() {
  const session = await auth()

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      language: true,
      slackUserId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">SalesForge — Hallinta</h1>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">
            ← Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminUserList users={users} currentUserId={session?.user?.id} />
      </main>
    </div>
  )
}
