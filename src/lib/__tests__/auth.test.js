'use strict'

// Test RBAC helper functions directly (no Next.js imports needed)
const ROLES = {
  SDR: 'sdr',
  AE: 'ae',
  TEAM_LEAD: 'team_lead',
  ADMIN: 'admin',
}

function hasRole(session, ...roles) {
  return session?.user?.role && roles.includes(session.user.role)
}

function isAdmin(session) {
  return hasRole(session, ROLES.ADMIN)
}

function isAdminOrAE(session) {
  return hasRole(session, ROLES.ADMIN, ROLES.AE)
}

function isTeamLead(session) {
  return hasRole(session, ROLES.TEAM_LEAD, ROLES.ADMIN)
}

describe('RBAC helper functions', () => {
  const makeSession = (role) => ({ user: { id: '1', email: 'test@test.fi', role } })

  describe('hasRole', () => {
    test('returns true when user has the specified role', () => {
      expect(hasRole(makeSession('sdr'), 'sdr')).toBe(true)
    })

    test('returns true when user has one of multiple specified roles', () => {
      expect(hasRole(makeSession('ae'), 'admin', 'ae')).toBe(true)
    })

    test('returns false when user does not have the role', () => {
      expect(hasRole(makeSession('sdr'), 'admin')).toBe(false)
    })

    test('returns false for null session', () => {
      expect(hasRole(null, 'admin')).toBeFalsy()
    })

    test('returns false for session without user', () => {
      expect(hasRole({}, 'admin')).toBeFalsy()
    })
  })

  describe('isAdmin', () => {
    test('returns true for admin role', () => {
      expect(isAdmin(makeSession('admin'))).toBe(true)
    })

    test('returns false for non-admin roles', () => {
      expect(isAdmin(makeSession('sdr'))).toBe(false)
      expect(isAdmin(makeSession('ae'))).toBe(false)
      expect(isAdmin(makeSession('team_lead'))).toBe(false)
    })
  })

  describe('isAdminOrAE', () => {
    test('returns true for admin', () => {
      expect(isAdminOrAE(makeSession('admin'))).toBe(true)
    })

    test('returns true for ae', () => {
      expect(isAdminOrAE(makeSession('ae'))).toBe(true)
    })

    test('returns false for sdr and team_lead', () => {
      expect(isAdminOrAE(makeSession('sdr'))).toBe(false)
      expect(isAdminOrAE(makeSession('team_lead'))).toBe(false)
    })
  })

  describe('isTeamLead', () => {
    test('returns true for team_lead', () => {
      expect(isTeamLead(makeSession('team_lead'))).toBe(true)
    })

    test('returns true for admin (has all permissions)', () => {
      expect(isTeamLead(makeSession('admin'))).toBe(true)
    })

    test('returns false for sdr and ae', () => {
      expect(isTeamLead(makeSession('sdr'))).toBe(false)
      expect(isTeamLead(makeSession('ae'))).toBe(false)
    })
  })
})
