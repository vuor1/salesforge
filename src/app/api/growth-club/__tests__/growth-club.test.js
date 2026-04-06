'use strict'

const VALID_CATEGORIES = ['raha', 'mindset', 'myynti', 'elämäntaidot', 'suhteet']

function validateSession({ title, category, content, sessionDate }) {
  if (!title?.trim() || !category || !content?.trim() || !sessionDate) {
    return { error: { code: 'VALIDATION_ERROR', message: 'title, category, content ja sessionDate ovat pakollisia' } }
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return { error: { code: 'VALIDATION_ERROR', message: `category tulee olla: ${VALID_CATEGORIES.join(', ')}` } }
  }
  return {
    data: {
      title: title.trim(),
      category,
      content: content.trim(),
      sessionDate: new Date(sessionDate),
    },
  }
}

function filterByCategory(sessions, category) {
  if (!category) return sessions
  return sessions.filter((s) => s.category === category)
}

describe('validateSession', () => {
  const valid = { title: 'Raha ja myynti', category: 'raha', content: 'Sisältö', sessionDate: '2026-03-01' }

  test('accepts valid session', () => {
    const result = validateSession(valid)
    expect(result.error).toBeUndefined()
    expect(result.data.title).toBe('Raha ja myynti')
  })

  test('trims title and content', () => {
    const result = validateSession({ ...valid, title: '  Raha  ', content: '  Sisältö  ' })
    expect(result.data.title).toBe('Raha')
    expect(result.data.content).toBe('Sisältö')
  })

  test('rejects missing title', () => {
    expect(validateSession({ ...valid, title: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateSession({ ...valid, title: null }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects missing content', () => {
    expect(validateSession({ ...valid, content: '' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects missing sessionDate', () => {
    expect(validateSession({ ...valid, sessionDate: null }).error.code).toBe('VALIDATION_ERROR')
  })

  test('rejects invalid category', () => {
    expect(validateSession({ ...valid, category: 'invalid' }).error.code).toBe('VALIDATION_ERROR')
  })

  test('accepts all valid categories', () => {
    for (const cat of VALID_CATEGORIES) {
      expect(validateSession({ ...valid, category: cat }).error).toBeUndefined()
    }
  })
})

describe('filterByCategory', () => {
  const sessions = [
    { id: '1', category: 'raha', title: 'Raha' },
    { id: '2', category: 'mindset', title: 'Mindset' },
    { id: '3', category: 'raha', title: 'Raha 2' },
    { id: '4', category: 'myynti', title: 'Myynti' },
  ]

  test('returns all sessions when no category filter', () => {
    expect(filterByCategory(sessions, null)).toHaveLength(4)
  })

  test('filters by category', () => {
    const result = filterByCategory(sessions, 'raha')
    expect(result).toHaveLength(2)
    expect(result.every((s) => s.category === 'raha')).toBe(true)
  })

  test('returns empty array for category with no sessions', () => {
    expect(filterByCategory(sessions, 'suhteet')).toHaveLength(0)
  })
})

// --- Story 6.2: Text search ---

function searchSessions(sessions, query, category) {
  return sessions.filter((s) => {
    const matchesCategory = !category || s.category === category
    if (!matchesCategory) return false
    if (!query?.trim()) return true
    const q = query.toLowerCase()
    return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
  })
}

describe('searchSessions', () => {
  const sessions = [
    { id: '1', category: 'raha', title: 'Rahan psykologia', content: 'Raha on työkalu' },
    { id: '2', category: 'mindset', title: 'Kasvumindset', content: 'Epäonnistuminen on oppimista' },
    { id: '3', category: 'myynti', title: 'Myyntipuhe', content: 'Asiakkaan tarve on tärkeintä' },
    { id: '4', category: 'raha', title: 'Sijoittaminen', content: 'Pitkäjänteisyys on avain' },
  ]

  test('returns all when query is empty', () => {
    expect(searchSessions(sessions, '', null)).toHaveLength(4)
    expect(searchSessions(sessions, null, null)).toHaveLength(4)
  })

  test('searches by title', () => {
    const result = searchSessions(sessions, 'myynti', null)
    expect(result.map((s) => s.id)).toContain('3')
  })

  test('searches by content', () => {
    const result = searchSessions(sessions, 'työkalu', null)
    expect(result.map((s) => s.id)).toContain('1')
  })

  test('search is case-insensitive', () => {
    // 'Rahan psykologia' (title) + 'Raha on työkalu' (content) — both in session 1
    const result = searchSessions(sessions, 'RAHAN', null)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  test('combines category filter and search', () => {
    const result = searchSessions(sessions, 'a', 'raha')
    expect(result.every((s) => s.category === 'raha')).toBe(true)
  })

  test('returns empty when no match', () => {
    expect(searchSessions(sessions, 'xyznotfound', null)).toHaveLength(0)
  })
})

// --- Story 6.3: AI Q&A prompt building ---

function buildGrowthClubPrompt(sessions) {
  return sessions
    .map((s) => `### ${s.title} (${s.category})\n${s.content}`)
    .join('\n\n---\n\n')
}

function validateQuestion({ question }) {
  if (!question?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Kysymys on pakollinen' } }
  }
  return { data: { question: question.trim() } }
}

describe('buildGrowthClubPrompt', () => {
  const sessions = [
    { id: '1', title: 'Rahan psykologia', category: 'raha', content: 'Raha on työkalu' },
    { id: '2', title: 'Kasvumindset', category: 'mindset', content: 'Epäonnistuminen on oppimista' },
  ]

  test('includes session title and category', () => {
    const prompt = buildGrowthClubPrompt(sessions)
    expect(prompt).toContain('Rahan psykologia')
    expect(prompt).toContain('raha')
  })

  test('includes session content', () => {
    const prompt = buildGrowthClubPrompt(sessions)
    expect(prompt).toContain('Raha on työkalu')
  })

  test('separates multiple sessions', () => {
    const prompt = buildGrowthClubPrompt(sessions)
    expect(prompt).toContain('---')
    expect(prompt).toContain('Kasvumindset')
  })

  test('returns empty string for no sessions', () => {
    expect(buildGrowthClubPrompt([])).toBe('')
  })
})

describe('validateQuestion', () => {
  test('accepts non-empty question', () => {
    const result = validateQuestion({ question: 'Mitä rahasta on sanottu?' })
    expect(result.error).toBeUndefined()
    expect(result.data.question).toBe('Mitä rahasta on sanottu?')
  })

  test('trims question', () => {
    const result = validateQuestion({ question: '  Kysymys  ' })
    expect(result.data.question).toBe('Kysymys')
  })

  test('rejects empty question', () => {
    expect(validateQuestion({ question: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateQuestion({ question: null }).error.code).toBe('VALIDATION_ERROR')
  })
})

// --- Story 6.4: Topic request ---

function validateTopicRequest({ content }) {
  if (!content?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Aiheen sisältö on pakollinen' } }
  }
  return { data: { content: content.trim(), status: 'pending' } }
}

function markTopicDone(requests, id) {
  return requests.map((r) => r.id === id ? { ...r, status: 'done' } : r)
}

describe('validateTopicRequest', () => {
  test('accepts valid content', () => {
    const result = validateTopicRequest({ content: 'Vastalauseiden käsittely' })
    expect(result.error).toBeUndefined()
    expect(result.data.content).toBe('Vastalauseiden käsittely')
    expect(result.data.status).toBe('pending')
  })

  test('trims content', () => {
    const result = validateTopicRequest({ content: '  Aihe  ' })
    expect(result.data.content).toBe('Aihe')
  })

  test('rejects empty content', () => {
    expect(validateTopicRequest({ content: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateTopicRequest({ content: null }).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('topic request status', () => {
  const requests = [
    { id: 'r1', content: 'Aihe 1', status: 'pending' },
    { id: 'r2', content: 'Aihe 2', status: 'pending' },
  ]

  test('marks single request as done', () => {
    const updated = markTopicDone(requests, 'r1')
    expect(updated.find((r) => r.id === 'r1').status).toBe('done')
    expect(updated.find((r) => r.id === 'r2').status).toBe('pending')
  })

  test('does not mutate original array', () => {
    markTopicDone(requests, 'r1')
    expect(requests[0].status).toBe('pending')
  })
})
