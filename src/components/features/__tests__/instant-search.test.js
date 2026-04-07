'use strict'

// Unit tests for InstantSearchField logic

const MAX_RECENT = 3

function saveRecentProject(existing, project) {
  const filtered = existing.filter((p) => p.id !== project.id)
  return [project, ...filtered].slice(0, MAX_RECENT)
}

function shouldTriggerSearch(query) {
  return query.trim().length >= 3
}

function highlight(text, query) {
  if (!query) return { parts: [{ text, highlighted: false }] }
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return { parts: [{ text, highlighted: false }] }
  return {
    parts: [
      { text: text.slice(0, idx), highlighted: false },
      { text: text.slice(idx, idx + query.length), highlighted: true },
      { text: text.slice(idx + query.length), highlighted: false },
    ].filter((p) => p.text.length > 0),
  }
}

describe('saveRecentProject', () => {
  test('prepends new project to empty list', () => {
    const result = saveRecentProject([], { id: 'p1', name: 'Projekti 1' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p1')
  })

  test('moves existing project to front instead of duplicating', () => {
    const existing = [
      { id: 'p1', name: 'P1' },
      { id: 'p2', name: 'P2' },
    ]
    const result = saveRecentProject(existing, { id: 'p2', name: 'P2' })
    expect(result[0].id).toBe('p2')
    expect(result).toHaveLength(2)
  })

  test('caps list at MAX_RECENT (3) items', () => {
    const existing = [
      { id: 'p1', name: 'P1' },
      { id: 'p2', name: 'P2' },
      { id: 'p3', name: 'P3' },
    ]
    const result = saveRecentProject(existing, { id: 'p4', name: 'P4' })
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('p4')
    expect(result.find((p) => p.id === 'p3')).toBeUndefined()
  })
})

describe('shouldTriggerSearch', () => {
  test('triggers for 3+ chars', () => {
    expect(shouldTriggerSearch('abc')).toBe(true)
    expect(shouldTriggerSearch('abcd')).toBe(true)
  })

  test('does not trigger for less than 3 chars', () => {
    expect(shouldTriggerSearch('')).toBe(false)
    expect(shouldTriggerSearch('a')).toBe(false)
    expect(shouldTriggerSearch('ab')).toBe(false)
  })

  test('ignores leading/trailing whitespace', () => {
    expect(shouldTriggerSearch('  a ')).toBe(false)
    expect(shouldTriggerSearch('  abc  ')).toBe(true)
  })
})

describe('highlight', () => {
  test('returns single part when no query', () => {
    const result = highlight('Projekti X', '')
    expect(result.parts).toHaveLength(1)
    expect(result.parts[0].highlighted).toBe(false)
  })

  test('returns single unhighlighted part when no match', () => {
    const result = highlight('Projekti X', 'zzz')
    expect(result.parts).toHaveLength(1)
    expect(result.parts[0].highlighted).toBe(false)
  })

  test('highlights matching substring', () => {
    const result = highlight('Projekti X', 'rojek')
    const highlighted = result.parts.find((p) => p.highlighted)
    expect(highlighted).toBeDefined()
    expect(highlighted.text).toBe('rojek')
  })

  test('is case-insensitive', () => {
    const result = highlight('Projekti X', 'PROJ')
    const highlighted = result.parts.find((p) => p.highlighted)
    expect(highlighted).toBeDefined()
    expect(highlighted.text.toLowerCase()).toBe('proj')
  })
})
