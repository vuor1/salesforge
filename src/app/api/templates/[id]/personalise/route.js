import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { getAIResponse } from '@/lib/ai'

function buildPersonalisePrompt({ template, project, note }) {
  const storiesExcerpt = (project.callStories ?? [])
    .slice(0, 3)
    .map((s) => `- ${s.content.substring(0, 150)}`)
    .join('\n')

  const lines = [
    `Personalisoi seuraava viestimalli projektin kontekstin pohjalta.`,
    ``,
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    project.callAngle ? `Soittokulma: ${project.callAngle}` : null,
    storiesExcerpt ? `\nTiimin kokemuksia projektista:\n${storiesExcerpt}` : null,
    ``,
    `Alkuperäinen malli (kanava: ${template.channel}):`,
    template.body,
    note ? `\nLisähuomio: ${note}` : null,
    ``,
    `Muokkaa malli niin, että se viittaa projektin spesifiseen kontekstiin ja tuntuu henkilökohtaiselta.`,
    `Säilytä viestin rakenne ja pituus. Vastaa samalla kielellä kuin alkuperäinen malli.`,
  ]

  return lines.filter((l) => l !== null).join('\n')
}

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id } = await params
  const { projectId, note } = await request.json()

  if (!projectId) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'projectId is required' } },
      { status: 400 }
    )
  }

  const [template, project] = await Promise.all([
    prisma.messageTemplate.findUnique({ where: { id } }),
    prisma.projectCard.findUnique({
      where: { id: projectId },
      include: {
        callStories: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { content: true },
        },
      },
    }),
  ])

  if (!template) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Template not found' } },
      { status: 404 }
    )
  }

  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  const systemPrompt =
    'Olet kokenut B2B-myyntiviestintäasiantuntija. Personalisoi viestimallit projektikohtaisesti. ' +
    'Vastaa samalla kielellä kuin alkuperäinen malli on kirjoitettu.'

  const userMessage = buildPersonalisePrompt({ template, project, note: note?.trim() || null })

  const result = await getAIResponse({ systemPrompt, userMessage })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 503 })
  }

  return Response.json({ data: { message: result.data } })
}
