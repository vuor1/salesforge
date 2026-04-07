'use strict'

// Test reaction toggle logic and notification rules

function toggleReaction(existingReaction) {
  if (existingReaction) {
    return { action: 'remove', reacted: false }
  }
  return { action: 'add', reacted: true }
}

function shouldNotifyAuthor({ scriptAuthorId, reactorId, authorSlackUserId }) {
  if (scriptAuthorId === reactorId) return false  // own reaction
  if (!authorSlackUserId) return false             // no Slack ID configured
  return true
}

describe('toggleReaction', () => {
  test('adds reaction when none exists', () => {
    const result = toggleReaction(null)
    expect(result.action).toBe('add')
    expect(result.reacted).toBe(true)
  })

  test('removes reaction when one exists', () => {
    const result = toggleReaction({ id: 'r1', userId: 'u1' })
    expect(result.action).toBe('remove')
    expect(result.reacted).toBe(false)
  })
})

describe('shouldNotifyAuthor', () => {
  test('notifies author when someone else reacts', () => {
    expect(shouldNotifyAuthor({
      scriptAuthorId: 'author-1',
      reactorId: 'user-2',
      authorSlackUserId: 'U12345',
    })).toBe(true)
  })

  test('does NOT notify on own reaction', () => {
    expect(shouldNotifyAuthor({
      scriptAuthorId: 'author-1',
      reactorId: 'author-1',
      authorSlackUserId: 'U12345',
    })).toBe(false)
  })

  test('does NOT notify when author has no Slack user ID', () => {
    expect(shouldNotifyAuthor({
      scriptAuthorId: 'author-1',
      reactorId: 'user-2',
      authorSlackUserId: null,
    })).toBe(false)
  })

  test('does NOT notify when Slack user ID is empty string', () => {
    expect(shouldNotifyAuthor({
      scriptAuthorId: 'author-1',
      reactorId: 'user-2',
      authorSlackUserId: '',
    })).toBe(false)
  })
})
