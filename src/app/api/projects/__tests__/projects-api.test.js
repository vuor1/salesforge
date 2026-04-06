'use strict'

// Unit tests for project management validation and role logic

function validateProjectInput({ name, industry }) {
  if (!name || !name.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Projektin nimi on pakollinen' } }
  }
  if (!industry || !industry.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Toimiala on pakollinen' } }
  }
  return { data: { name: name.trim(), industry: industry.trim() } }
}

function checkProjectRole(role) {
  if (!['admin', 'ae'].includes(role)) {
    return { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
  }
  return { error: null }
}

describe('validateProjectInput', () => {
  test('accepts valid name and industry', () => {
    const result = validateProjectInput({ name: 'Asiakas Oy', industry: 'IT' })
    expect(result.data.name).toBe('Asiakas Oy')
    expect(result.data.industry).toBe('IT')
    expect(result.error).toBeUndefined()
  })

  test('trims whitespace', () => {
    const result = validateProjectInput({ name: '  Asiakas  ', industry: '  IT  ' })
    expect(result.data.name).toBe('Asiakas')
    expect(result.data.industry).toBe('IT')
  })

  test('rejects missing name', () => {
    expect(validateProjectInput({ name: '', industry: 'IT' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateProjectInput({ name: '   ', industry: 'IT' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateProjectInput({ name: null, industry: 'IT' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects missing industry', () => {
    expect(validateProjectInput({ name: 'Asiakas', industry: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateProjectInput({ name: 'Asiakas', industry: null }).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('checkProjectRole', () => {
  test('allows admin', () => {
    const { error } = checkProjectRole('admin')
    expect(error).toBeNull()
  })

  test('allows ae', () => {
    const { error } = checkProjectRole('ae')
    expect(error).toBeNull()
  })

  test('rejects sdr', () => {
    const { error } = checkProjectRole('sdr')
    expect(error.code).toBe('FORBIDDEN')
  })

  test('rejects unknown role', () => {
    const { error } = checkProjectRole('viewer')
    expect(error.code).toBe('FORBIDDEN')
  })
})

describe('PATCH validation — admin/AE only', () => {
  test('only admin and ae can edit project fields', () => {
    const roles = ['admin', 'ae', 'sdr', 'viewer']
    const allowed = roles.filter((r) => checkProjectRole(r).error === null)
    const denied = roles.filter((r) => checkProjectRole(r).error !== null)
    expect(allowed).toEqual(['admin', 'ae'])
    expect(denied).toEqual(['sdr', 'viewer'])
  })
})
