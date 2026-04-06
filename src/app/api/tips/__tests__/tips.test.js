'use strict'

const VALID_TYPES = ['avaus', 'vastalause', 'lähestymistapa', 'clousaus']

function validateTip({ type, content, context }) {
  if (!VALID_TYPES.includes(type)) {
    return { error: { code: 'VALIDATION_ERROR', message: `type tulee olla: ${VALID_TYPES.join(', ')}` } }
  }
  if (!content?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Vinkin sisältö on pakollinen' } }
  }
  if (!context?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Selitys on pakollinen' } }
  }
  return { data: { type, content: content.trim(), context: context.trim() } }
}

function toggleLike(tips, tipId, userId) {
  return tips.map((t) => {
    if (t.id !== tipId) return t
    const liked = !t.likedByMe
    return { ...t, likedByMe: liked, likeCount: liked ? t.likeCount + 1 : t.likeCount - 1 }
  })
}

describe('validateTip', () => {
  const valid = { type: 'avaus', content: 'Testi avaus', context: 'Toimi IT-päättäjille' }

  test('accepts all valid types', () => {
    for (const type of VALID_TYPES) {
      expect(validateTip({ ...valid, type }).error).toBeUndefined()
    }
  })

  test('rejects invalid type', () => {
    expect(validateTip({ ...valid, type: 'tuntematon' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects missing content', () => {
    expect(validateTip({ ...valid, content: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateTip({ ...valid, content: null }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects missing context', () => {
    expect(validateTip({ ...valid, context: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateTip({ ...valid, context: null }).error.code).toBe('VALIDATION_ERROR')
  })

  test('trims content and context', () => {
    const result = validateTip({ ...valid, content: '  Avaus  ', context: '  Konteksti  ' })
    expect(result.data.content).toBe('Avaus')
    expect(result.data.context).toBe('Konteksti')
  })
})

describe('toggleLike', () => {
  const tips = [
    { id: 't1', likedByMe: false, likeCount: 3 },
    { id: 't2', likedByMe: true, likeCount: 5 },
  ]

  test('likes an unliked tip', () => {
    const result = toggleLike(tips, 't1', 'user-1')
    const tip = result.find((t) => t.id === 't1')
    expect(tip.likedByMe).toBe(true)
    expect(tip.likeCount).toBe(4)
  })

  test('unlikes a liked tip', () => {
    const result = toggleLike(tips, 't2', 'user-1')
    const tip = result.find((t) => t.id === 't2')
    expect(tip.likedByMe).toBe(false)
    expect(tip.likeCount).toBe(4)
  })

  test('does not affect other tips', () => {
    const result = toggleLike(tips, 't1', 'user-1')
    expect(result.find((t) => t.id === 't2').likeCount).toBe(5)
  })
})
