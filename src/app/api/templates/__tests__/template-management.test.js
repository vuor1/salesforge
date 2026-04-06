'use strict'

// Unit tests for template management validation and role protection

const VALID_CHANNELS = ['linkedin', 'email', 'sms', 'phone']

function validateTemplateCreate({ title, channel, body }) {
  if (!title?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Otsikko on pakollinen' } }
  }
  if (!VALID_CHANNELS.includes(channel)) {
    return { error: { code: 'VALIDATION_ERROR', message: `Kanavan tulee olla: ${VALID_CHANNELS.join(', ')}` } }
  }
  if (!body?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Malliteksti on pakollinen' } }
  }
  return { data: { title: title.trim(), channel, body: body.trim() } }
}

function checkManageRole(role) {
  if (!['admin', 'ae'].includes(role)) {
    return { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }
  }
  return { error: null }
}

describe('validateTemplateCreate', () => {
  test('accepts valid template', () => {
    const result = validateTemplateCreate({
      title: 'LinkedIn avaus',
      channel: 'linkedin',
      body: 'Hei [Nimi]...',
    })
    expect(result.data.title).toBe('LinkedIn avaus')
    expect(result.error).toBeUndefined()
  })

  test('trims title and body', () => {
    const result = validateTemplateCreate({
      title: '  Otsikko  ',
      channel: 'email',
      body: '  Teksti  ',
    })
    expect(result.data.title).toBe('Otsikko')
    expect(result.data.body).toBe('Teksti')
  })

  test('rejects missing title', () => {
    expect(validateTemplateCreate({ title: '', channel: 'linkedin', body: 'teksti' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateTemplateCreate({ title: null, channel: 'linkedin', body: 'teksti' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects invalid channel', () => {
    expect(validateTemplateCreate({ title: 'T', channel: 'telegram', body: 'B' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateTemplateCreate({ title: 'T', channel: '', body: 'B' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('accepts all valid channels', () => {
    for (const channel of VALID_CHANNELS) {
      const result = validateTemplateCreate({ title: 'T', channel, body: 'B' })
      expect(result.error).toBeUndefined()
    }
  })

  test('rejects missing body', () => {
    expect(validateTemplateCreate({ title: 'T', channel: 'linkedin', body: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateTemplateCreate({ title: 'T', channel: 'linkedin', body: '   ' }).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('checkManageRole', () => {
  test('allows admin', () => {
    expect(checkManageRole('admin').error).toBeNull()
  })

  test('allows ae', () => {
    expect(checkManageRole('ae').error).toBeNull()
  })

  test('rejects sdr', () => {
    expect(checkManageRole('sdr').error.code).toBe('FORBIDDEN')
  })

  test('rejects team_lead', () => {
    expect(checkManageRole('team_lead').error.code).toBe('FORBIDDEN')
  })

  test('only admin and ae can manage templates', () => {
    const roles = ['admin', 'ae', 'sdr', 'team_lead', 'viewer']
    const allowed = roles.filter((r) => checkManageRole(r).error === null)
    expect(allowed).toEqual(['admin', 'ae'])
  })
})
