'use strict'

// Unit tests for script library filtering and ownership

function filterLibraryScripts(scripts) {
  return scripts.filter((s) => s.status === 'saved')
}

function groupByProject(scripts) {
  return scripts.reduce((acc, script) => {
    const key = script.projectCard.id
    if (!acc[key]) acc[key] = { project: script.projectCard, scripts: [] }
    acc[key].scripts.push(script)
    return acc
  }, {})
}

function canDeleteScript(script, currentUserId) {
  return script.user.id === currentUserId
}

const makeScript = (id, userId, status, projectId = 'proj-1') => ({
  id,
  userId,
  status,
  opening: 'Avaus',
  objections: '',
  closing: '',
  user: { id: userId, name: `User ${userId}`, email: `${userId}@test.fi` },
  projectCard: { id: projectId, name: `Projekti ${projectId}`, industry: 'IT' },
})

describe('filterLibraryScripts', () => {
  const scripts = [
    makeScript('s1', 'u1', 'saved'),
    makeScript('s2', 'u1', 'draft'),
    makeScript('s3', 'u2', 'saved'),
    makeScript('s4', 'u2', 'draft'),
  ]

  test('returns only saved scripts', () => {
    const result = filterLibraryScripts(scripts)
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.id)).toEqual(['s1', 's3'])
  })

  test('excludes all draft scripts', () => {
    const result = filterLibraryScripts(scripts)
    const hasDraft = result.some((s) => s.status === 'draft')
    expect(hasDraft).toBe(false)
  })

  test('returns empty list when no saved scripts', () => {
    const draftsOnly = scripts.filter((s) => s.status === 'draft')
    expect(filterLibraryScripts(draftsOnly)).toHaveLength(0)
  })
})

describe('groupByProject', () => {
  const scripts = [
    makeScript('s1', 'u1', 'saved', 'proj-1'),
    makeScript('s2', 'u2', 'saved', 'proj-1'),
    makeScript('s3', 'u1', 'saved', 'proj-2'),
  ]

  test('groups scripts by project', () => {
    const groups = groupByProject(scripts)
    expect(Object.keys(groups)).toHaveLength(2)
    expect(groups['proj-1'].scripts).toHaveLength(2)
    expect(groups['proj-2'].scripts).toHaveLength(1)
  })

  test('includes project metadata in each group', () => {
    const groups = groupByProject(scripts)
    expect(groups['proj-1'].project.name).toBe('Projekti proj-1')
  })
})

describe('canDeleteScript', () => {
  const currentUserId = 'u1'

  test('owner can delete their script', () => {
    const script = makeScript('s1', 'u1', 'saved')
    expect(canDeleteScript(script, currentUserId)).toBe(true)
  })

  test("non-owner cannot delete others' scripts", () => {
    const script = makeScript('s1', 'u2', 'saved')
    expect(canDeleteScript(script, currentUserId)).toBe(false)
  })

  test('all users see delete button only on own scripts', () => {
    const scripts = [
      makeScript('s1', 'u1', 'saved'),
      makeScript('s2', 'u2', 'saved'),
      makeScript('s3', 'u3', 'saved'),
    ]
    const deletable = scripts.filter((s) => canDeleteScript(s, currentUserId))
    expect(deletable).toHaveLength(1)
    expect(deletable[0].id).toBe('s1')
  })
})
