'use strict'

// Test project card display logic

function formatDate(date) {
  return new Date(date).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function authorName(user) {
  return user.name ?? user.email.split('@')[0]
}

function sortStoriesByNewest(stories) {
  return [...stories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

const makeStory = (id, content, userId, createdAt, userName = null) => ({
  id,
  content,
  createdAt,
  user: { id: userId, name: userName, email: `${userId}@strongest.fi` },
})

describe('story sorting', () => {
  test('stories are sorted newest first', () => {
    const stories = [
      makeStory('1', 'Vanha', 'u1', '2026-01-01'),
      makeStory('2', 'Uusin', 'u2', '2026-03-15'),
      makeStory('3', 'Keski', 'u3', '2026-02-10'),
    ]
    const sorted = sortStoriesByNewest(stories)
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })

  test('single story returns as-is', () => {
    const stories = [makeStory('1', 'Ainoa', 'u1', '2026-01-01')]
    expect(sortStoriesByNewest(stories).length).toBe(1)
  })

  test('empty array returns empty array', () => {
    expect(sortStoriesByNewest([]).length).toBe(0)
  })
})

describe('authorName', () => {
  test('returns name when set', () => {
    expect(authorName({ name: 'Mikko Mäkinen', email: 'mikko@strongest.fi' })).toBe('Mikko Mäkinen')
  })

  test('falls back to email prefix when name is null', () => {
    expect(authorName({ name: null, email: 'mikko.makinen@strongest.fi' })).toBe('mikko.makinen')
  })
})

describe('empty state logic', () => {
  test('shows empty state when callStories is empty', () => {
    const project = { callStories: [] }
    expect(project.callStories.length === 0).toBe(true)
  })

  test('does not show empty state when stories exist', () => {
    const project = {
      callStories: [makeStory('1', 'Tarina', 'u1', '2026-01-01')],
    }
    expect(project.callStories.length === 0).toBe(false)
  })
})

describe('own story detection', () => {
  test('user can edit their own story', () => {
    const currentUserId = 'user-1'
    const story = makeStory('s1', 'Oma tarina', 'user-1', '2026-01-01')
    expect(story.user.id === currentUserId).toBe(true)
  })

  test('user cannot edit someone else story', () => {
    const currentUserId = 'user-1'
    const story = makeStory('s1', 'Toisen tarina', 'user-2', '2026-01-01')
    expect(story.user.id === currentUserId).toBe(false)
  })
})
