export async function sendSlackMessage({ webhookUrl, message }) {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    })
    if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`)
    return { data: 'sent' }
  } catch (error) {
    return { error: { code: 'SLACK_UNAVAILABLE', message: error.message } }
  }
}
