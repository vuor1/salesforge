import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import NavBar from '@/components/NavBar'

export default async function AuthLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const initials = session.user.name?.slice(0, 2).toUpperCase() ?? 'OV'

  return (
    <>
      <NavBar userInitials={initials} />
      {children}
      <Toaster position="bottom-right" />
    </>
  )
}
