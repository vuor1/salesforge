'use strict'

// Test admin users API logic (business rules, not HTTP layer)

const VALID_ROLES = ['sdr', 'ae', 'team_lead', 'admin']

function validateCreateUser({ email, password, role }) {
  if (!email || !password) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } }
  }
  const userRole = VALID_ROLES.includes(role) ? role : 'sdr'
  return { data: { email, role: userRole } }
}

function validateUpdateUser(currentUserId, targetUserId, { role, isActive }) {
  if (currentUserId === targetUserId && isActive === false) {
    return { error: { code: 'FORBIDDEN', message: 'You cannot deactivate your own account' } }
  }
  const updateData = {}
  if (role !== undefined && VALID_ROLES.includes(role)) updateData.role = role
  if (isActive !== undefined && typeof isActive === 'boolean') updateData.isActive = isActive
  return { data: updateData }
}

function canLogin(user) {
  return user.isActive === true
}

describe('createUser validation', () => {
  test('requires email', () => {
    const result = validateCreateUser({ password: 'test1234', role: 'sdr' })
    expect(result.error).toBeDefined()
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  test('requires password', () => {
    const result = validateCreateUser({ email: 'test@test.fi', role: 'sdr' })
    expect(result.error).toBeDefined()
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  test('defaults unknown role to sdr', () => {
    const result = validateCreateUser({ email: 'test@test.fi', password: 'pass', role: 'superuser' })
    expect(result.data.role).toBe('sdr')
  })

  test('accepts all valid roles', () => {
    for (const role of VALID_ROLES) {
      const result = validateCreateUser({ email: 'test@test.fi', password: 'pass', role })
      expect(result.data.role).toBe(role)
    }
  })

  test('succeeds with valid email and password', () => {
    const result = validateCreateUser({ email: 'new@test.fi', password: 'secret123', role: 'ae' })
    expect(result.data).toBeDefined()
    expect(result.error).toBeUndefined()
  })
})

describe('updateUser validation', () => {
  const adminId = 'admin-1'
  const userId = 'user-1'

  test('admin cannot deactivate their own account', () => {
    const result = validateUpdateUser(adminId, adminId, { isActive: false })
    expect(result.error).toBeDefined()
    expect(result.error.code).toBe('FORBIDDEN')
  })

  test('admin can deactivate other users', () => {
    const result = validateUpdateUser(adminId, userId, { isActive: false })
    expect(result.data).toBeDefined()
    expect(result.data.isActive).toBe(false)
    expect(result.error).toBeUndefined()
  })

  test('role update only applies valid roles', () => {
    const result = validateUpdateUser(adminId, userId, { role: 'ae' })
    expect(result.data.role).toBe('ae')
  })

  test('invalid role is ignored', () => {
    const result = validateUpdateUser(adminId, userId, { role: 'superadmin' })
    expect(result.data.role).toBeUndefined()
  })

  test('non-boolean isActive is ignored', () => {
    const result = validateUpdateUser(adminId, userId, { isActive: 'true' })
    expect(result.data.isActive).toBeUndefined()
  })

  test('admin can reactivate a user', () => {
    const result = validateUpdateUser(adminId, userId, { isActive: true })
    expect(result.data.isActive).toBe(true)
  })
})

describe('deactivated user login check', () => {
  test('active user can log in', () => {
    expect(canLogin({ isActive: true })).toBe(true)
  })

  test('deactivated user cannot log in', () => {
    expect(canLogin({ isActive: false })).toBe(false)
  })
})
