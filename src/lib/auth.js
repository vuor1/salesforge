import { auth } from '@/auth'

export { auth }

export const ROLES = {
  SDR: 'sdr',
  AE: 'ae',
  TEAM_LEAD: 'team_lead',
  ADMIN: 'admin',
}

export function hasRole(session, ...roles) {
  return session?.user?.role && roles.includes(session.user.role)
}

export function isAdmin(session) {
  return hasRole(session, ROLES.ADMIN)
}

export function isAdminOrAE(session) {
  return hasRole(session, ROLES.ADMIN, ROLES.AE)
}

export function isTeamLead(session) {
  return hasRole(session, ROLES.TEAM_LEAD, ROLES.ADMIN)
}
