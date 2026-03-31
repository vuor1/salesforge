import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const publicRoutes = ['/login']

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route))

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
