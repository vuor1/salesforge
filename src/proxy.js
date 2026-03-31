import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const publicRoutes = ['/login', '/not-authorized']
const adminRoutes = ['/admin']

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r))
  const isApiRoute = pathname.startsWith('/api/')
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r))

  // Unauthenticated requests
  if (!req.auth) {
    if (isApiRoute) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (!isPublic) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Role check for admin routes
  if (req.auth && isAdminRoute && req.auth.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/not-authorized', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
