'use strict'

// Unit tests for AI suggestion prompt building and parsing

function buildOpeningPrompt({ project, callStories }) {
  const storiesExcerpt = callStories
    .slice(0, 3)
    .map((s) => `- ${s.content.substring(0, 150)}`)
    .join('\n')

  return [
    `Generoi 3 erilaista avauslause-ehdotusta B2B-myyntipuheluun.`,
    ``,
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    project.callAngle ? `Soittokulma: ${project.callAngle}` : null,
    storiesExcerpt ? `\nTiimin kokemuksia tästä projektista:\n${storiesExcerpt}` : null,
    ``,
    `Palauta täsmälleen 3 ehdotusta numeroituna muodossa:`,
    `1. [avauslause]`,
    `2. [avauslause]`,
    `3. [avauslause]`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function buildObjectionPrompt({ project, callStories, objectionContext }) {
  const storiesExcerpt = callStories
    .slice(0, 3)
    .map((s) => `- ${s.content.substring(0, 150)}`)
    .join('\n')

  return [
    `Ehdota vastaus seuraavaan vastaväitteeseen B2B-myyntipuhelussa.`,
    ``,
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    project.callAngle ? `Soittokulma: ${project.callAngle}` : null,
    objectionContext ? `Vastaväite: ${objectionContext}` : `Vastaväite: Ei kiinnosta`,
    storiesExcerpt ? `\nTiimin kokemuksia tästä projektista:\n${storiesExcerpt}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function parseOpeningSuggestions(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const suggestions = []
  for (const line of lines) {
    const match = line.match(/^[1-3]\.\s+(.+)$/)
    if (match) suggestions.push(match[1])
  }

  if (suggestions.length === 0) {
    return [text.trim()]
  }

  return suggestions
}

const project = {
  name: 'Asiakas Oy',
  industry: 'IT',
  callAngle: 'Kustannussäästöt automaatiolla',
}

describe('buildOpeningPrompt', () => {
  test('includes project name, industry, and call angle', () => {
    const prompt = buildOpeningPrompt({ project, callStories: [] })
    expect(prompt).toContain('Asiakas Oy')
    expect(prompt).toContain('IT')
    expect(prompt).toContain('Kustannussäästöt automaatiolla')
  })

  test('asks for 3 numbered suggestions', () => {
    const prompt = buildOpeningPrompt({ project, callStories: [] })
    expect(prompt).toContain('1. [avauslause]')
    expect(prompt).toContain('2. [avauslause]')
    expect(prompt).toContain('3. [avauslause]')
  })

  test('includes team stories as context (max 3)', () => {
    const stories = [
      { content: 'Tarina 1' },
      { content: 'Tarina 2' },
      { content: 'Tarina 3' },
      { content: 'Tarina 4 (ei pitäisi näkyä)' },
    ]
    const prompt = buildOpeningPrompt({ project, callStories: stories })
    expect(prompt).toContain('Tarina 1')
    expect(prompt).toContain('Tarina 3')
    expect(prompt).not.toContain('Tarina 4')
  })

  test('omits call angle when not present', () => {
    const p = { ...project, callAngle: null }
    const prompt = buildOpeningPrompt({ project: p, callStories: [] })
    expect(prompt).not.toContain('Soittokulma:')
  })
})

describe('buildObjectionPrompt', () => {
  test('includes objection context', () => {
    const prompt = buildObjectionPrompt({ project, callStories: [], objectionContext: 'Ei kiinnosta' })
    expect(prompt).toContain('Vastaväite: Ei kiinnosta')
  })

  test('uses default objection when none provided', () => {
    const prompt = buildObjectionPrompt({ project, callStories: [], objectionContext: undefined })
    expect(prompt).toContain('Vastaväite: Ei kiinnosta')
  })
})

describe('parseOpeningSuggestions', () => {
  test('parses 3 numbered suggestions', () => {
    const text = `1. Hei, soitan Asiakas Oy:stä.\n2. Moikka, olen myyjä.\n3. Päivää, onko hyvä hetki?`
    const result = parseOpeningSuggestions(text)
    expect(result).toHaveLength(3)
    expect(result[0]).toBe('Hei, soitan Asiakas Oy:stä.')
    expect(result[1]).toBe('Moikka, olen myyjä.')
    expect(result[2]).toBe('Päivää, onko hyvä hetki?')
  })

  test('falls back to full text if parsing fails', () => {
    const text = 'Vain yksi ehdotus ilman numeroa'
    const result = parseOpeningSuggestions(text)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(text)
  })

  test('ignores empty lines', () => {
    const text = `\n1. Ensimmäinen ehdotus\n\n2. Toinen ehdotus\n\n3. Kolmas ehdotus\n`
    const result = parseOpeningSuggestions(text)
    expect(result).toHaveLength(3)
  })
})
