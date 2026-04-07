'use strict'

// Test cron business logic

const FI_HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-01-06', '2026-04-03', '2026-04-06', '2026-04-07',
  '2026-05-01', '2026-05-14', '2026-05-24', '2026-06-19', '2026-06-20',
  '2026-11-07', '2026-12-06', '2026-12-24', '2026-12-25', '2026-12-26',
])

function isWorkday(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z')
  const day = date.getUTCDay()
  if (day === 0 || day === 6) return false
  return !FI_HOLIDAYS_2026.has(dateStr)
}

function getPendingProjects(views, experiences, userId) {
  const viewedProjects = new Set(
    views.filter((v) => v.userId === userId).map((v) => v.projectCardId)
  )
  const loggedProjects = new Set(
    experiences.filter((e) => e.authorId === userId).map((e) => e.projectCardId)
  )
  return [...viewedProjects].filter((pid) => !loggedProjects.has(pid))
}

describe('isWorkday', () => {
  test('Monday is a workday', () => expect(isWorkday('2026-04-13')).toBe(true))
  test('Saturday is not a workday', () => expect(isWorkday('2026-04-11')).toBe(false))
  test('Sunday is not a workday', () => expect(isWorkday('2026-04-12')).toBe(false))
  test('Vappu (2026-05-01) is not a workday', () => expect(isWorkday('2026-05-01')).toBe(false))
  test('Itsenäisyyspäivä (2026-12-06) is not a workday', () => expect(isWorkday('2026-12-06')).toBe(false))
  test('Regular Tuesday is a workday', () => expect(isWorkday('2026-04-14')).toBe(true))
})

describe('getPendingProjects', () => {
  const views = [
    { userId: 'u1', projectCardId: 'p1' },
    { userId: 'u1', projectCardId: 'p2' },
    { userId: 'u2', projectCardId: 'p1' },
  ]

  test('returns projects viewed but not logged', () => {
    const experiences = [{ authorId: 'u1', projectCardId: 'p1' }]
    const pending = getPendingProjects(views, experiences, 'u1')
    expect(pending).toEqual(['p2'])
  })

  test('returns empty when all viewed projects have experience', () => {
    const experiences = [
      { authorId: 'u1', projectCardId: 'p1' },
      { authorId: 'u1', projectCardId: 'p2' },
    ]
    expect(getPendingProjects(views, experiences, 'u1')).toHaveLength(0)
  })

  test('returns all viewed projects when no experiences logged', () => {
    expect(getPendingProjects(views, [], 'u1')).toHaveLength(2)
  })

  test('does not include other users viewed projects', () => {
    const pending = getPendingProjects(views, [], 'u2')
    expect(pending).toEqual(['p1'])
  })
})
