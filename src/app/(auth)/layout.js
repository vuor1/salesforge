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
    <div className="flex flex-col h-full">
      <a href="#main-content" className="skip-link">Siirry pääsisältöön</a>
      <NavBar userInitials={initials} role={session.user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1C1C1C',
            color: '#ffffff',
            borderLeft: '3px solid #F97316',
          },
        }}
      />
    </div>
  )
}
