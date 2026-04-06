'use strict'

const VALID_THEMES = ['growth_club', 'own_experience', 'sales_tip', 'mindset']

const THEME_PROMPTS = {
  growth_club: 'Growth Club -session oppien pohjalta',
  own_experience: 'oman kokemuksen pohjalta',
  sales_tip: 'myyntivinkin muodossa',
  mindset: 'mindset-aiheesta',
}

function validateGenerateRequest({ theme, context }) {
  if (!VALID_THEMES.includes(theme)) {
    return { error: { code: 'VALIDATION_ERROR', message: `theme tulee olla: ${VALID_THEMES.join(', ')}` } }
  }
  if (!context?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Konteksti on pakollinen' } }
  }
  return { data: { theme, context: context.trim() } }
}

function getThemePrompt(theme) {
  return THEME_PROMPTS[theme] ?? null
}

describe('validateGenerateRequest', () => {
  const valid = { theme: 'growth_club', context: 'Puhuttiin rahasta' }

  test('accepts all valid themes', () => {
    for (const theme of VALID_THEMES) {
      expect(validateGenerateRequest({ ...valid, theme }).error).toBeUndefined()
    }
  })

  test('rejects invalid theme', () => {
    expect(validateGenerateRequest({ ...valid, theme: 'invalid' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateGenerateRequest({ ...valid, theme: '' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects empty context', () => {
    expect(validateGenerateRequest({ ...valid, context: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateGenerateRequest({ ...valid, context: '   ' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateGenerateRequest({ ...valid, context: null }).error.code).toBe('VALIDATION_ERROR')
  })

  test('trims context', () => {
    const result = validateGenerateRequest({ ...valid, context: '  Konteksti  ' })
    expect(result.data.context).toBe('Konteksti')
  })
})

describe('getThemePrompt', () => {
  test('returns prompt for all valid themes', () => {
    for (const theme of VALID_THEMES) {
      expect(getThemePrompt(theme)).not.toBeNull()
    }
  })

  test('returns null for unknown theme', () => {
    expect(getThemePrompt('unknown')).toBeNull()
  })

  test('each theme has distinct prompt', () => {
    const prompts = VALID_THEMES.map((t) => getThemePrompt(t))
    const unique = new Set(prompts)
    expect(unique.size).toBe(VALID_THEMES.length)
  })
})
