import { auth } from '@/auth'

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    return {
      session: null,
      response: Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      ),
    }
  }
  return { session, response: null }
}

export async function requireRole(...roles) {
  const { session, response } = await requireAuth()
  if (response) return { session: null, response }

  if (!roles.includes(session.user.role)) {
    return {
      session: null,
      response: Response.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      ),
    }
  }
  return { session, response: null }
}
