const ADVICE_TYPE_LABELS = {
  soittorunko: 'Soittorunko',
  viestimalli: 'Viestimalli',
  yleinen: 'Yleinen neuvo',
}

export function buildPeerSupportMessage({ requester, project, adviceType, description, projectUrl }) {
  const typeLabel = ADVICE_TYPE_LABELS[adviceType] ?? adviceType
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

export async function sendSlackMessage({ webhookUrl, message }) {
  if (!webhookUrl) {
    return { error: { code: 'SLACK_NOT_CONFIGURED', message: 'Slack webhook URL not configured' } }
  }
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
