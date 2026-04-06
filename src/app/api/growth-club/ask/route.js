import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { getAIResponse } from '@/lib/ai'

export async function POST(request) {
  const { response } = await requireAuth()
  if (response) return response

  const { question } = await request.json()

  if (!question?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Kysymys on pakollinen' } },
      { status: 400 }
    )
  }

  const sessions = await prisma.growthClubSession.findMany({
    orderBy: { sessionDate: 'desc' },
  })

  if (sessions.length === 0) {
    return Response.json(
      { error: { code: 'NO_CONTENT', message: 'Growth Club -sessioita ei ole vielä lisätty' } },
      { status: 422 }
    )
  }

  const sessionContext = sessions
    .map((s) => `### ${s.title} (${s.category})\n${s.content}`)
    .join('\n\n---\n\n')

  const systemPrompt = `Olet Growth Club -asiantuntija Strongest Groupin myyntitiimille. Vastaat kysymyksiin perustuen alla oleviin Growth Club -sessioihin.

Vastaa suomeksi. Viittaa aina käyttämiisi sessioihin otsikolla, esimerkiksi: *(Lähde: Sessio-otsikko)*. Jos sessioissa ei ole vastausta kysymykseen, sano se suoraan.

Growth Club -sessiot:

${sessionContext}`

  const result = await getAIResponse({
    systemPrompt,
    userMessage: question.trim(),
  })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 503 })
  }

  return Response.json({ data: { answer: result.data } })
}
