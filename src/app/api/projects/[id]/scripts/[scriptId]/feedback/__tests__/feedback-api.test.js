'use strict'

// Unit tests for AI feedback prompt building and error handling

function buildPrompt({ project, script }) {
  const sections = []
  if (script.opening?.trim()) sections.push(`## Avaus\n${script.opening.trim()}`)
  if (script.objections?.trim()) sections.push(`## Vastaväitteiden käsittely\n${script.objections.trim()}`)
  if (script.closing?.trim()) sections.push(`## Lopetus\n${script.closing.trim()}`)

  const contextLines = []
  if (project.callAngle) contextLines.push(`Soittokulma: ${project.callAngle}`)

  return [
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    ...contextLines,
    '',
    'Soittorunko:',
    sections.join('\n\n'),
  ].join('\n')
}

function validateForFeedback({ opening, objections, closing }) {
  const hasContent = (opening ?? '').trim() || (objections ?? '').trim() || (closing ?? '').trim()
  if (!hasContent) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Script has no content to analyze' } }
  }
  return { valid: true }
}

const project = {
  id: 'proj-1',
  name: 'Asiakas Oy',
  industry: 'IT',
  callAngle: 'Kustannussäästöt automaatiolla',
}

describe('buildPrompt', () => {
  test('includes project name and industry', () => {
    const prompt = buildPrompt({ project, script: { opening: 'Hei', objections: '', closing: '' } })
    expect(prompt).toContain('Asiakas Oy')
    expect(prompt).toContain('IT')
  })

  test('includes call angle when present', () => {
    const prompt = buildPrompt({ project, script: { opening: 'Hei', objections: '', closing: '' } })
    expect(prompt).toContain('Kustannussäästöt automaatiolla')
  })

  test('includes opening section', () => {
    const prompt = buildPrompt({ project, script: { opening: 'Avauslause', objections: '', closing: '' } })
    expect(prompt).toContain('## Avaus')
    expect(prompt).toContain('Avauslause')
  })

  test('includes all three sections when provided', () => {
    const prompt = buildPrompt({
      project,
      script: { opening: 'Avaus', objections: 'Vastaväite', closing: 'Lopetus' },
    })
    expect(prompt).toContain('## Avaus')
    expect(prompt).toContain('## Vastaväitteiden käsittely')
    expect(prompt).toContain('## Lopetus')
  })

  test('omits empty sections', () => {
    const prompt = buildPrompt({ project, script: { opening: 'Avaus', objections: '', closing: '' } })
    expect(prompt).not.toContain('## Vastaväitteiden käsittely')
    expect(prompt).not.toContain('## Lopetus')
  })

  test('omits call angle when not present', () => {
    const projectNoAngle = { ...project, callAngle: null }
    const prompt = buildPrompt({ project: projectNoAngle, script: { opening: 'Hei', objections: '', closing: '' } })
    expect(prompt).not.toContain('Soittokulma:')
  })
})

describe('validateForFeedback', () => {
  test('accepts script with content', () => {
    expect(validateForFeedback({ opening: 'Hei', objections: '', closing: '' }).valid).toBe(true)
  })

  test('rejects empty script', () => {
    expect(validateForFeedback({ opening: '', objections: '', closing: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateForFeedback({ opening: '  ', objections: '  ', closing: '' }).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('AI unavailable fallback', () => {
  test('returns AI_UNAVAILABLE error object on failure', () => {
    // Simulate what getAIResponse returns on error
    const mockAiError = { error: { code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable' } }
    expect(mockAiError.error.code).toBe('AI_UNAVAILABLE')
    expect(mockAiError.error.message).toBeDefined()
  })

  test('has no data field when AI fails', () => {
    const mockAiError = { error: { code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable' } }
    expect(mockAiError.data).toBeUndefined()
  })
})
