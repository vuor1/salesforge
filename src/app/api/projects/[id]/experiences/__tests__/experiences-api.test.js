'use strict'

// Test experience validation logic

function validateExperience({ scriptId, content, score }) {
  if (!scriptId?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'scriptId is required' } }
  }
  if (!content?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'content is required' } }
  }
  if (score !== undefined && score !== null) {
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return { error: { code: 'VALIDATION_ERROR', message: 'score must be an integer 1–5' } }
    }
  }
  return { data: { scriptId: scriptId.trim(), content: content.trim(), score: score ?? null } }
}

function computeAverageScore(experiences) {
  const scored = experiences.filter((e) => e.score !== null && e.score !== undefined)
  if (scored.length < 3) return null
  const sum = scored.reduce((acc, e) => acc + e.score, 0)
  return Math.round((sum / scored.length) * 10) / 10
}

describe('validateExperience', () => {
  test('accepts valid experience without score', () => {
    const r = validateExperience({ scriptId: 's1', content: 'Meni hyvin' })
    expect(r.data).toBeDefined()
    expect(r.data.score).toBeNull()
    expect(r.error).toBeUndefined()
  })

  test('accepts valid experience with score', () => {
    const r = validateExperience({ scriptId: 's1', content: 'Meni hyvin', score: 4 })
    expect(r.data.score).toBe(4)
  })

  test('requires scriptId', () => {
    expect(validateExperience({ content: 'teksti' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateExperience({ scriptId: '', content: 'teksti' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('requires content', () => {
    expect(validateExperience({ scriptId: 's1', content: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateExperience({ scriptId: 's1' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects score out of range', () => {
    expect(validateExperience({ scriptId: 's1', content: 'ok', score: 0 }).error.code).toBe('VALIDATION_ERROR')
    expect(validateExperience({ scriptId: 's1', content: 'ok', score: 6 }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects non-integer score', () => {
    expect(validateExperience({ scriptId: 's1', content: 'ok', score: 3.5 }).error.code).toBe('VALIDATION_ERROR')
  })

  test('allows null score explicitly', () => {
    const r = validateExperience({ scriptId: 's1', content: 'ok', score: null })
    expect(r.data.score).toBeNull()
  })

  test('trims content', () => {
    const r = validateExperience({ scriptId: 's1', content: '  tarina  ' })
    expect(r.data.content).toBe('tarina')
  })
})

describe('computeAverageScore', () => {
  test('returns null when fewer than 3 scored experiences', () => {
    expect(computeAverageScore([])).toBeNull()
    expect(computeAverageScore([{ score: 4 }, { score: 5 }])).toBeNull()
  })

  test('returns average when 3+ scored experiences', () => {
    const avg = computeAverageScore([{ score: 4 }, { score: 5 }, { score: 3 }])
    expect(avg).toBe(4)
  })

  test('ignores unscored experiences in average', () => {
    const avg = computeAverageScore([
      { score: 4 }, { score: 5 }, { score: 3 }, { score: null }, { score: undefined }
    ])
    expect(avg).toBe(4)
  })

  test('rounds to 1 decimal', () => {
    const avg = computeAverageScore([{ score: 4 }, { score: 4 }, { score: 5 }])
    expect(avg).toBe(4.3)
  })
})
