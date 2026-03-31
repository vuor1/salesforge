import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/not-authorized')
  }

  return <>{children}</>
}
