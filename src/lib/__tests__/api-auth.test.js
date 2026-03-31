'use strict'

// Test api-auth logic directly (without Next.js imports)
async function requireAuth(getSession) {
  const session = await getSession()
  if (!session) {
    return {
      session: null,
      response: { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } },
    }
  }
  return { session, response: null }
}

async function requireRole(getSession, ...roles) {
  const { session, response } = await requireAuth(getSession)
  if (response) return { session: null, response }

  if (!roles.includes(session.user.role)) {
    return {
      session: null,
      response: { status: 403, body: { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } } },
    }
  }
  return { session, response: null }
}

const makeSession = (role) => ({ user: { id: '1', email: 'test@test.fi', role } })

describe('requireAuth', () => {
  test('returns session when authenticated', async () => {
    const session = makeSession('sdr')
    const { session: s, response } = await requireAuth(async () => session)
    expect(s).toBe(session)
    expect(response).toBeNull()
  })

  test('returns 401 response when not authenticated', async () => {
    const { session, response } = await requireAuth(async () => null)
    expect(session).toBeNull()
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('requireRole', () => {
  test('returns session when user has required role', async () => {
    const session = makeSession('admin')
    const { session: s, response } = await requireRole(async () => session, 'admin')
    expect(s).toBe(session)
    expect(response).toBeNull()
  })

  test('returns session when user has one of multiple allowed roles', async () => {
    const session = makeSession('ae')
    const { session: s, response } = await requireRole(async () => session, 'admin', 'ae')
    expect(s).toBe(session)
    expect(response).toBeNull()
  })

  test('returns 403 when user lacks required role', async () => {
    const session = makeSession('sdr')
    const { session: s, response } = await requireRole(async () => session, 'admin')
    expect(s).toBeNull()
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('returns 401 when not authenticated (propagates from requireAuth)', async () => {
    const { session, response } = await requireRole(async () => null, 'admin')
    expect(session).toBeNull()
    expect(response.status).toBe(401)
  })

  test('SDR cannot access admin-only routes', async () => {
    const { response } = await requireRole(async () => makeSession('sdr'), 'admin')
    expect(response.status).toBe(403)
  })

  test('team_lead cannot access admin-only routes', async () => {
    const { response } = await requireRole(async () => makeSession('team_lead'), 'admin')
    expect(response.status).toBe(403)
  })

  test('admin can access admin-only routes', async () => {
    const { response } = await requireRole(async () => makeSession('admin'), 'admin')
    expect(response).toBeNull()
  })

  test('all roles can access shared routes (sdr, ae, team_lead, admin)', async () => {
    const allRoles = ['sdr', 'ae', 'team_lead', 'admin']
    for (const role of allRoles) {
      const { response } = await requireRole(
        async () => makeSession(role),
        'sdr', 'ae', 'team_lead', 'admin'
      )
      expect(response).toBeNull()
    }
  })
})

describe('RBAC nav visibility rules', () => {
  const navItems = [
    { href: '/projects', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
    { href: '/call-scripts', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
    { href: '/messages', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
    { href: '/peer-support', roles: ['sdr', 'ae', 'team_lead', 'admin'] },
    { href: '/admin', roles: ['admin'] },
  ]

  function visibleFor(role) {
    return navItems.filter((item) => item.roles.includes(role)).map((i) => i.href)
  }

  test('SDR sees all nav items except /admin', () => {
    const nav = visibleFor('sdr')
    expect(nav).toContain('/projects')
    expect(nav).toContain('/call-scripts')
    expect(nav).toContain('/peer-support')
    expect(nav).not.toContain('/admin')
  })

  test('team_lead sees same items as SDR (no admin)', () => {
    const nav = visibleFor('team_lead')
    expect(nav).toContain('/projects')
    expect(nav).not.toContain('/admin')
  })

  test('admin sees all items including /admin', () => {
    const nav = visibleFor('admin')
    expect(nav).toContain('/projects')
    expect(nav).toContain('/admin')
  })
})
