import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { getAIResponse } from '@/lib/ai'

function buildPrompt({ project, script }) {
  const sections = []
  if (script.opening?.trim()) sections.push(`## Avaus\n${script.opening.trim()}`)
  if (script.objections?.trim()) sections.push(`## Vastaväitteiden käsittely\n${script.objections.trim()}`)
  if (script.closing?.trim()) sections.push(`## Lopetus\n${script.closing.trim()}`)

  const contextLines = []
  if (project.callAngle) contextLines.push(`Soittokulma: ${project.callAngle}`)

  return [
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    ...contextLines,
    '',
    'Soittorunko:',
    sections.join('\n\n'),
    '',
    'Anna konkreettinen palaute: nosta ensin vahvuudet, sitten kehityskohteet ja parannusehdotukset. Ole tiivis ja käytännönläheinen.',
  ].join('\n')
}

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id, scriptId } = await params

  const [project, script] = await Promise.all([
    prisma.projectCard.findUnique({ where: { id } }),
    prisma.callScript.findUnique({ where: { id: scriptId } }),
  ])

  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  if (!script || script.projectCardId !== id) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Script not found' } },
      { status: 404 }
    )
  }

  const hasContent = script.opening?.trim() || script.objections?.trim() || script.closing?.trim()
  if (!hasContent) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Script has no content to analyze' } },
      { status: 400 }
    )
  }

  const userMessage = buildPrompt({ project, script })

  const systemPrompt =
    'Olet kokenut B2B-myyntivalmentaja. Analysoi soittorunko ja anna konkreettinen palaute. ' +
    'Vastaa samalla kielellä kuin soittorunko on kirjoitettu.'

  const result = await getAIResponse({ systemPrompt, userMessage })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 503 })
  }

  return Response.json({ data: { feedback: result.data } })
}
