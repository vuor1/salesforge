'use strict'

// Test AI response wrapper error handling logic
async function getAIResponse({ systemPrompt, userMessage, _mockClient }) {
  const client = _mockClient
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    return { data: message.content[0].text }
  } catch (error) {
    return { error: { code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable' } }
  }
}

describe('getAIResponse', () => {
  test('returns { data: text } on success', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'This is AI feedback' }],
        }),
      },
    }

    const result = await getAIResponse({
      systemPrompt: 'You are a sales coach',
      userMessage: 'Review my script',
      _mockClient: mockClient,
    })

    expect(result).toEqual({ data: 'This is AI feedback' })
  })

  test('passes systemPrompt and userMessage to client', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'response' }],
        }),
      },
    }

    await getAIResponse({
      systemPrompt: 'System prompt here',
      userMessage: 'User message here',
      _mockClient: mockClient,
    })

    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'System prompt here',
        messages: [{ role: 'user', content: 'User message here' }],
        model: 'claude-opus-4-6',
      })
    )
  })

  test('returns error object when client throws', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API timeout')),
      },
    }

    const result = await getAIResponse({
      systemPrompt: 'prompt',
      userMessage: 'message',
      _mockClient: mockClient,
    })

    expect(result.error).toBeDefined()
    expect(result.error.code).toBe('AI_UNAVAILABLE')
    expect(result.error.message).toBe('AI service temporarily unavailable')
  })

  test('returns error without exposing internal error details', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockRejectedValue(new Error('Internal server error with sensitive data')),
      },
    }

    const result = await getAIResponse({
      systemPrompt: 'prompt',
      userMessage: 'message',
      _mockClient: mockClient,
    })

    expect(result.error.message).toBe('AI service temporarily unavailable')
    expect(result.error.message).not.toContain('sensitive')
  })
})
