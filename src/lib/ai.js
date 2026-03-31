import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function getAIResponse({ systemPrompt, userMessage, context = {} }) {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
    return { data: message.content[0].text }
  } catch (error) {
    return { error: { code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable' } }
  }
}
