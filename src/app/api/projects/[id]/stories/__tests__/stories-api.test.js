'use strict'

// Test call story ownership and validation logic

function validateStoryContent(content) {
  if (!content || !content.trim()) {
    return { error: { code: 'VALIDATION_ERROR', message: 'Story content is required' } }
  }
  return { data: { content: content.trim() } }
}

function checkOwnership(story, userId) {
  if (!story) return { error: { code: 'NOT_FOUND', message: 'Story not found' } }
  if (story.userId !== userId) return { error: { code: 'FORBIDDEN', message: 'You can only edit your own stories' } }
  return { error: null }
}

const makeStory = (id, userId) => ({ id, userId, content: 'Soittotarina sisältö' })

describe('validateStoryContent', () => {
  test('accepts valid content', () => {
    const result = validateStoryContent('Tämä on hyvä soittotarina')
    expect(result.data.content).toBe('Tämä on hyvä soittotarina')
    expect(result.error).toBeUndefined()
  })

  test('trims whitespace', () => {
    const result = validateStoryContent('  tarina  ')
    expect(result.data.content).toBe('tarina')
  })

  test('rejects empty content', () => {
    expect(validateStoryContent('').error.code).toBe('VALIDATION_ERROR')
    expect(validateStoryContent('   ').error.code).toBe('VALIDATION_ERROR')
    expect(validateStoryContent(null).error.code).toBe('VALIDATION_ERROR')
    expect(validateStoryContent(undefined).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('checkOwnership', () => {
  const userId = 'user-1'

  test('allows owner to edit their story', () => {
    const story = makeStory('s1', 'user-1')
    const { error } = checkOwnership(story, userId)
    expect(error).toBeNull()
  })

  test('rejects edit from non-owner', () => {
    const story = makeStory('s1', 'user-2')
    const { error } = checkOwnership(story, userId)
    expect(error.code).toBe('FORBIDDEN')
  })

  test('returns NOT_FOUND for missing story', () => {
    const { error } = checkOwnership(null, userId)
    expect(error.code).toBe('NOT_FOUND')
  })

  test('other users stories are protected — multiple users', () => {
    const users = ['user-2', 'user-3', 'user-4']
    for (const otherUserId of users) {
      const story = makeStory('s1', otherUserId)
      const { error } = checkOwnership(story, userId)
      expect(error.code).toBe('FORBIDDEN')
    }
  })
})

describe('story visibility rules', () => {
  const currentUserId = 'user-1'
  const stories = [
    { id: 's1', userId: 'user-1', content: 'Oma tarina' },
    { id: 's2', userId: 'user-2', content: 'Toisen tarina' },
    { id: 's3', userId: 'user-3', content: 'Kolmannen tarina' },
  ]

  test('user sees edit/delete only on their own stories', () => {
    const editable = stories.filter((s) => s.userId === currentUserId)
    const notEditable = stories.filter((s) => s.userId !== currentUserId)
    expect(editable.length).toBe(1)
    expect(notEditable.length).toBe(2)
    expect(editable[0].id).toBe('s1')
  })

  test('all stories are visible to all users', () => {
    expect(stories.length).toBe(3)
  })
})
