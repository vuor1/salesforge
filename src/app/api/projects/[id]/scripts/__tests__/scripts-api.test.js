'use strict'

// Unit tests for call script validation and ownership logic

function validateScriptSave({ opening, objections, closing }) {
  const hasContent = (opening ?? '').trim() || (objections ?? '').trim() || (closing ?? '').trim()
  if (!hasContent) {
    return { error: { code: 'VALIDATION_ERROR', message: 'At least one section must have content' } }
  }
  return { data: { opening: opening ?? '', objections: objections ?? '', closing: closing ?? '' } }
}

function checkScriptOwnership(script, userId) {
  if (!script) return { error: { code: 'NOT_FOUND', message: 'Script not found' } }
  if (script.userId !== userId) return { error: { code: 'FORBIDDEN', message: 'You can only edit your own scripts' } }
  return { error: null }
}

describe('validateScriptSave', () => {
  test('accepts script with opening only', () => {
    const result = validateScriptSave({ opening: 'Hei, olen myyjä', objections: '', closing: '' })
    expect(result.error).toBeUndefined()
    expect(result.data.opening).toBe('Hei, olen myyjä')
  })

  test('accepts script with all sections', () => {
    const result = validateScriptSave({
      opening: 'Avaus',
      objections: 'Vastaväite',
      closing: 'Lopetus',
    })
    expect(result.error).toBeUndefined()
  })

  test('rejects script with no content', () => {
    expect(validateScriptSave({ opening: '', objections: '', closing: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateScriptSave({ opening: '  ', objections: '  ', closing: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateScriptSave({}).error.code).toBe('VALIDATION_ERROR')
  })

  test('accepts objections-only script', () => {
    const result = validateScriptSave({ opening: '', objections: 'Vastaväite: ei kiinnosta', closing: '' })
    expect(result.error).toBeUndefined()
  })
})

describe('checkScriptOwnership', () => {
  const userId = 'user-1'

  test('allows owner to edit their script', () => {
    const script = { id: 's1', userId: 'user-1' }
    const { error } = checkScriptOwnership(script, userId)
    expect(error).toBeNull()
  })

  test('rejects edit from non-owner', () => {
    const script = { id: 's1', userId: 'user-2' }
    const { error } = checkScriptOwnership(script, userId)
    expect(error.code).toBe('FORBIDDEN')
  })

  test('returns NOT_FOUND for missing script', () => {
    const { error } = checkScriptOwnership(null, userId)
    expect(error.code).toBe('NOT_FOUND')
  })
})

describe('script visibility rules', () => {
  const currentUserId = 'user-1'
  const scripts = [
    { id: 's1', userId: 'user-1', status: 'draft', opening: 'Oma luonnos' },
    { id: 's2', userId: 'user-1', status: 'saved', opening: 'Oma tallennettu' },
    { id: 's3', userId: 'user-2', status: 'saved', opening: 'Tiimin skripti' },
    { id: 's4', userId: 'user-2', status: 'draft', opening: 'Toisen luonnos' },
  ]

  test('user sees own scripts (both draft and saved)', () => {
    const visible = scripts.filter(
      (s) => s.userId === currentUserId || s.status === 'saved'
    )
    expect(visible.length).toBe(3) // s1, s2, s3
    expect(visible.map((s) => s.id)).toEqual(['s1', 's2', 's3'])
  })

  test("other users' drafts are not visible", () => {
    const visible = scripts.filter(
      (s) => s.userId === currentUserId || s.status === 'saved'
    )
    const ids = visible.map((s) => s.id)
    expect(ids).not.toContain('s4')
  })

  test('saved scripts are visible to all users', () => {
    const saved = scripts.filter((s) => s.status === 'saved')
    expect(saved.length).toBe(2)
  })
})
