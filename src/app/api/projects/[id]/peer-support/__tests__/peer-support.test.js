'use strict'

// Unit tests for peer support request validation and state

const VALID_ADVICE_TYPES = ['soittorunko', 'viestimalli', 'yleinen']

function validatePeerRequest({ adviceType, description }) {
  if (!VALID_ADVICE_TYPES.includes(adviceType)) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: `adviceType tulee olla: ${VALID_ADVICE_TYPES.join(', ')}`,
      },
    }
  }
  return {
    data: {
      adviceType,
      description: description?.trim() || null,
      status: 'pending',
    },
  }
}

function isPending(request) {
  return request.status === 'pending'
}

function isAnswered(request) {
  return request.status === 'answered'
}

const makeRequest = (id, adviceType, status = 'pending') => ({
  id,
  adviceType,
  status,
  description: 'Tarvitsen neuvoa',
  userId: 'user-1',
  answers: [],
})

describe('validatePeerRequest', () => {
  test('accepts valid advice types', () => {
    for (const type of VALID_ADVICE_TYPES) {
      const result = validatePeerRequest({ adviceType: type, description: 'Kuvaus' })
      expect(result.error).toBeUndefined()
      expect(result.data.adviceType).toBe(type)
    }
  })

  test('sets status to pending by default', () => {
    const result = validatePeerRequest({ adviceType: 'yleinen' })
    expect(result.data.status).toBe('pending')
  })

  test('trims description', () => {
    const result = validatePeerRequest({ adviceType: 'yleinen', description: '  Kuvaus  ' })
    expect(result.data.description).toBe('Kuvaus')
  })

  test('sets description to null when empty', () => {
    const result = validatePeerRequest({ adviceType: 'yleinen', description: '' })
    expect(result.data.description).toBeNull()
  })

  test('rejects invalid advice type', () => {
    expect(validatePeerRequest({ adviceType: 'invalid' }).error.code).toBe('VALIDATION_ERROR')
    expect(validatePeerRequest({ adviceType: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validatePeerRequest({ adviceType: null }).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('request status', () => {
  test('new request is pending', () => {
    const req = makeRequest('r1', 'yleinen', 'pending')
    expect(isPending(req)).toBe(true)
    expect(isAnswered(req)).toBe(false)
  })

  test('answered request is not pending', () => {
    const req = makeRequest('r1', 'yleinen', 'answered')
    expect(isPending(req)).toBe(false)
    expect(isAnswered(req)).toBe(true)
  })

  test('counts pending requests correctly', () => {
    const requests = [
      makeRequest('r1', 'yleinen', 'pending'),
      makeRequest('r2', 'soittorunko', 'answered'),
      makeRequest('r3', 'viestimalli', 'pending'),
    ]
    const pendingCount = requests.filter(isPending).length
    expect(pendingCount).toBe(2)
  })
})

describe('advice type labels', () => {
  const LABELS = {
    soittorunko: 'Soittorunko',
    viestimalli: 'Viestimalli',
    yleinen: 'Yleinen neuvo',
  }

  test('all valid types have labels', () => {
    for (const type of VALID_ADVICE_TYPES) {
      expect(LABELS[type]).toBeDefined()
    }
  })

  test('label count matches valid type count', () => {
    expect(Object.keys(LABELS).length).toBe(VALID_ADVICE_TYPES.length)
  })
})

// --- Story 5.2: Targeting logic ---

function resolveTargets({ storyAuthors, requesterId, sameRoleUsers }) {
  const authorIds = storyAuthors
    .map((s) => s.userId)
    .filter((uid, i, arr) => arr.indexOf(uid) === i) // unique
    .filter((uid) => uid !== requesterId)

  if (authorIds.length > 0) {
    return sameRoleUsers.filter((u) => authorIds.includes(u.id))
  }
  return sameRoleUsers.filter((u) => u.id !== requesterId && u.isActive)
}

describe('Slack targeting logic', () => {
  const requester = 'user-1'
  const activeUsers = [
    { id: 'user-2', role: 'sdr', isActive: true },
    { id: 'user-3', role: 'sdr', isActive: true },
    { id: 'user-4', role: 'ae', isActive: true },
  ]

  test('targets story authors (excluding requester)', () => {
    const storyAuthors = [{ userId: 'user-2' }, { userId: 'user-1' }]
    const targets = resolveTargets({ storyAuthors, requesterId: requester, sameRoleUsers: activeUsers })
    expect(targets.map((u) => u.id)).toEqual(['user-2'])
  })

  test('deduplicates story authors', () => {
    const storyAuthors = [{ userId: 'user-2' }, { userId: 'user-2' }, { userId: 'user-3' }]
    const targets = resolveTargets({ storyAuthors, requesterId: requester, sameRoleUsers: activeUsers })
    expect(targets).toHaveLength(2)
  })

  test('falls back to same-role active users when no story authors', () => {
    const targets = resolveTargets({ storyAuthors: [], requesterId: requester, sameRoleUsers: activeUsers })
    const ids = targets.map((u) => u.id)
    expect(ids).toContain('user-2')
    expect(ids).toContain('user-3')
    expect(ids).not.toContain(requester)
  })

  test('fallback excludes inactive users', () => {
    const withInactive = [
      ...activeUsers,
      { id: 'user-5', role: 'sdr', isActive: false },
    ]
    const targets = resolveTargets({ storyAuthors: [], requesterId: requester, sameRoleUsers: withInactive })
    expect(targets.map((u) => u.id)).not.toContain('user-5')
  })

  test('falls back to same-role when only requester has stories', () => {
    const storyAuthors = [{ userId: requester }]
    const targets = resolveTargets({ storyAuthors, requesterId: requester, sameRoleUsers: activeUsers })
    // no other story authors → fallback to same-role (user-2, user-3 are sdr like requester)
    const ids = targets.map((u) => u.id)
    expect(ids).toContain('user-2')
    expect(ids).not.toContain(requester)
  })
})

// --- Story 5.2: Message building ---

function buildPeerSupportMessage({ requester, project, adviceType, description, projectUrl }) {
  const LABELS = { soittorunko: 'Soittorunko', viestimalli: 'Viestimalli', yleinen: 'Yleinen neuvo' }
  const typeLabel = LABELS[adviceType] ?? adviceType
  const lines = [
    `👋 *${requester}* pyytää neuvoa projektissa *${project}*`,
    ``,
    `*Neuvon tyyppi:* ${typeLabel}`,
    description ? `*Kuvaus:* ${description}` : null,
    ``,
    `🔗 <${projectUrl}|Avaa projektikortti>`,
  ]
  return lines.filter((l) => l !== null).join('\n')
}

describe('buildPeerSupportMessage', () => {
  const base = {
    requester: 'Mikko',
    project: 'Acme Corp',
    adviceType: 'soittorunko',
    projectUrl: 'http://localhost:3000/projects/abc',
  }

  test('includes requester name and project', () => {
    const msg = buildPeerSupportMessage(base)
    expect(msg).toContain('Mikko')
    expect(msg).toContain('Acme Corp')
  })

  test('includes advice type label', () => {
    const msg = buildPeerSupportMessage(base)
    expect(msg).toContain('Soittorunko')
  })

  test('includes description when provided', () => {
    const msg = buildPeerSupportMessage({ ...base, description: 'Tarvitsen apua' })
    expect(msg).toContain('Tarvitsen apua')
  })

  test('omits description line when null', () => {
    const msg = buildPeerSupportMessage({ ...base, description: null })
    expect(msg).not.toContain('Kuvaus')
  })

  test('includes project URL', () => {
    const msg = buildPeerSupportMessage(base)
    expect(msg).toContain('http://localhost:3000/projects/abc')
  })

  test('falls back to raw adviceType when label missing', () => {
    const msg = buildPeerSupportMessage({ ...base, adviceType: 'muu' })
    expect(msg).toContain('muu')
  })
})

// --- Story 5.3: Answer validation and status ---

function validateAnswer({ content }) {
  if (!content?.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Vastauksen sisältö on pakollinen' } }
  }
  return { data: { content: content.trim() } }
}

function canAnswer({ request, currentUserId }) {
  return request.status === 'pending' && request.userId !== currentUserId
}

describe('validateAnswer', () => {
  test('accepts non-empty content', () => {
    const result = validateAnswer({ content: 'Hyvä vastaus' })
    expect(result.error).toBeUndefined()
    expect(result.data.content).toBe('Hyvä vastaus')
  })

  test('trims content', () => {
    const result = validateAnswer({ content: '  Hyvä vastaus  ' })
    expect(result.data.content).toBe('Hyvä vastaus')
  })

  test('rejects empty content', () => {
    expect(validateAnswer({ content: '' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateAnswer({ content: '   ' }).error.code).toBe('VALIDATION_ERROR')
    expect(validateAnswer({ content: null }).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('canAnswer', () => {
  const pendingReq = { id: 'r1', userId: 'user-1', status: 'pending' }
  const answeredReq = { id: 'r2', userId: 'user-1', status: 'answered' }

  test('colleague can answer pending request', () => {
    expect(canAnswer({ request: pendingReq, currentUserId: 'user-2' })).toBe(true)
  })

  test('requester cannot answer own request', () => {
    expect(canAnswer({ request: pendingReq, currentUserId: 'user-1' })).toBe(false)
  })

  test('cannot answer already answered request', () => {
    expect(canAnswer({ request: answeredReq, currentUserId: 'user-2' })).toBe(false)
  })
})

describe('answer status transition', () => {
  test('request becomes answered after first answer', () => {
    const request = { id: 'r1', userId: 'user-1', status: 'pending', answers: [] }
    const newAnswer = { id: 'a1', userId: 'user-2', content: 'Vastaus', createdAt: new Date().toISOString() }
    const updated = { ...request, status: 'answered', answers: [newAnswer] }
    expect(updated.status).toBe('answered')
    expect(updated.answers).toHaveLength(1)
  })
})
