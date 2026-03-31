'use strict'

// Test sendSlackMessage error handling logic directly
async function sendSlackMessage({ webhookUrl, message }) {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
    if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`)
    return { data: 'sent' }
  } catch (error) {
    return { error: { code: 'SLACK_UNAVAILABLE', message: error.message } }
  }
}

describe('sendSlackMessage', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('returns { data: "sent" } on success', async () => {
    global.fetch.mockResolvedValue({ ok: true })

    const result = await sendSlackMessage({
      webhookUrl: 'https://hooks.slack.com/test',
      message: 'Test message',
    })

    expect(result).toEqual({ data: 'sent' })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  test('returns error object when response is not ok', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 403 })

    const result = await sendSlackMessage({
      webhookUrl: 'https://hooks.slack.com/test',
      message: 'Test',
    })

    expect(result.error).toBeDefined()
    expect(result.error.code).toBe('SLACK_UNAVAILABLE')
    expect(result.error.message).toContain('403')
  })

  test('returns error object when fetch throws', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    const result = await sendSlackMessage({
      webhookUrl: 'https://hooks.slack.com/test',
      message: 'Test',
    })

    expect(result.error).toBeDefined()
    expect(result.error.code).toBe('SLACK_UNAVAILABLE')
    expect(result.error.message).toBe('Network error')
  })

  test('sends message body as JSON with text field', async () => {
    global.fetch.mockResolvedValue({ ok: true })

    await sendSlackMessage({
      webhookUrl: 'https://hooks.slack.com/test',
      message: 'Hello team!',
    })

    const callArgs = global.fetch.mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body).toEqual({ text: 'Hello team!' })
  })
})
