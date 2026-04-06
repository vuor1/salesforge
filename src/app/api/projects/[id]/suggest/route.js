import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { getAIResponse } from '@/lib/ai'

function buildOpeningPrompt({ project, callStories }) {
  const storiesExcerpt = callStories
    .slice(0, 3)
    .map((s) => `- ${s.content.substring(0, 150)}`)
    .join('\n')

  return [
    `Generoi 3 erilaista avauslause-ehdotusta B2B-myyntipuheluun.`,
    ``,
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    project.callAngle ? `Soittokulma: ${project.callAngle}` : null,
    storiesExcerpt
      ? `\nTiimin kokemuksia tästä projektista:\n${storiesExcerpt}`
      : null,
    ``,
    `Palauta täsmälleen 3 ehdotusta numeroituna muodossa:`,
    `1. [avauslause]`,
    `2. [avauslause]`,
    `3. [avauslause]`,
    ``,
    `Avauslauseiden tulee olla luontevia, projektikohtaisia ja herättää kiinnostus. Vastaa samalla kielellä kuin soittokulma on kirjoitettu.`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function buildObjectionPrompt({ project, callStories, objectionContext }) {
  const storiesExcerpt = callStories
    .slice(0, 3)
    .map((s) => `- ${s.content.substring(0, 150)}`)
    .join('\n')

  return [
    `Ehdota vastaus seuraavaan vastaväitteeseen B2B-myyntipuhelussa.`,
    ``,
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    project.callAngle ? `Soittokulma: ${project.callAngle}` : null,
    objectionContext ? `Vastaväite: ${objectionContext}` : `Vastaväite: Ei kiinnosta`,
    storiesExcerpt
      ? `\nTiimin kokemuksia tästä projektista:\n${storiesExcerpt}`
      : null,
    ``,
    `Anna konkreettinen, empaattinen vastaus joka vie keskustelua eteenpäin. Vastaa samalla kielellä kuin vastaväite on esitetty.`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function parseOpeningSuggestions(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const suggestions = []
  for (const line of lines) {
    const match = line.match(/^[1-3]\.\s+(.+)$/)
    if (match) suggestions.push(match[1])
  }

  // Fallback: if parsing fails, split by numbered lines loosely
  if (suggestions.length === 0) {
    return [text.trim()]
  }

  return suggestions
}

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id } = await params
  const { type, context: objectionContext } = await request.json()

  if (!['opening', 'objection'].includes(type)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'type must be opening or objection' } },
      { status: 400 }
    )
  }

  const project = await prisma.projectCard.findUnique({
    where: { id },
    include: {
      callStories: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { content: true },
      },
    },
  })

  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  const systemPrompt =
    'Olet kokenut B2B-myyntivalmentaja. Anna käytännönläheisiä, projektikohtaisia neuvoja. ' +
    'Vastaa samalla kielellä kuin käyttäjän syöte.'

  let userMessage
  if (type === 'opening') {
    userMessage = buildOpeningPrompt({ project, callStories: project.callStories })
  } else {
    userMessage = buildObjectionPrompt({
      project,
      callStories: project.callStories,
      objectionContext,
    })
  }

  const result = await getAIResponse({ systemPrompt, userMessage })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 503 })
  }

  if (type === 'opening') {
    const suggestions = parseOpeningSuggestions(result.data)
    return Response.json({ data: { suggestions } })
  }

  return Response.json({ data: { suggestion: result.data } })
}
