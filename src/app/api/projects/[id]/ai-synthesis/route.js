import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getAIResponse } from '@/lib/ai'

function buildSynthesisPrompt(project, scripts, experiences) {
  const hasData = scripts.length > 0 || experiences.length > 0

  const scriptSummaries = scripts.slice(0, 5).map((s, i) => {
    const text = [s.opening, s.objections, s.closing].filter(Boolean).join(' / ')
    const expCount = experiences.filter((e) => e.callScriptId === s.id).length
    return `${i + 1}. "${s.title ?? 'Nimetön runko'}" — ${text.slice(0, 200)}${text.length > 200 ? '…' : ''} (${expCount} kokemusta, ${s.reactions?.length ?? 0} reaktiota)`
  })

  const expSummaries = experiences.slice(0, 8).map((e) => {
    const score = e.score ? ` [${e.score}/5 tähteä]` : ''
    return `• ${e.content}${score}`
  })

  if (!hasData) {
    return {
      system: `Olet kokenut B2B-myynnin valmentaja. Vastaa aina samalla kielellä kuin käyttäjä — suomeksi tai englanniksi. Ole tiivistä ja käytännönläheinen.`,
      userMessage: `Projekti: ${project.name} (toimiala: ${project.industry ?? 'ei määritelty'})
Soittokulma: ${project.callAngle ?? 'ei määritelty'}

Tällä projektilla ei ole vielä tiimin soittorunkoja tai kokemuksia.

Anna 3 toimialakohtaista soittokulmaehdotusta bullet-listana. Kerro lopussa lähteesi: "Vastaukseni perustuu yleiseen tietoon — ei vielä tiimin kokemuksia."`,
    }
  }

  return {
    system: `Olet kokenut B2B-myynnin valmentaja, joka analysoi tiimin soittodataa ja antaa käytännönläheistä neuvoa. Vastaa aina samalla kielellä kuin käyttäjä. Ole tiivistä: max 4 bulletia synteesissa. Mainitse aina datasi lähde.`,
    userMessage: `Projekti: ${project.name} (toimiala: ${project.industry ?? 'ei määritelty'})
Soittokulma: ${project.callAngle ?? 'ei määritelty'}

Tiimin soittorungot (${scripts.length} kpl):
${scriptSummaries.join('\n')}

Tiimin kokemukset (${experiences.length} kpl):
${expSummaries.join('\n')}

Tee lyhyt synteesi tiimin parhaan lähestymistavan pääpointeista bullet-listana. Lopeta sitaattiin: "Tämä perustuu ${scripts.length} soittorunkoon ja ${experiences.length} kokemukseen."`,
  }
}

function buildFollowUpPrompt(project, scripts, experiences, question) {
  const hasData = scripts.length > 0 || experiences.length > 0

  const context = hasData
    ? `Projekti: ${project.name}, toimiala: ${project.industry ?? '?'}, soittokulma: ${project.callAngle ?? '?'}
Tiimillä on ${scripts.length} soittorunkoa ja ${experiences.length} kokemusta tästä projektista.
Parhaimmat kokemukset: ${experiences.slice(0, 3).map((e) => e.content.slice(0, 100)).join(' | ')}`
    : `Projekti: ${project.name}, toimiala: ${project.industry ?? '?'}, soittokulma: ${project.callAngle ?? '?'}. Ei vielä tiimin dataa.`

  return {
    system: `Olet kokenut B2B-myynnin valmentaja. Vastaa samalla kielellä kuin kysymys. Ole tiivistä ja käytännönläheinen. Jos käytät tiimin dataa, mainitse se.`,
    userMessage: `${context}\n\nKysymys: ${question}`,
  }
}

export async function POST(request, { params }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { question } = body // null/undefined = initial synthesis, string = follow-up

  const project = await prisma.projectCard.findUnique({ where: { id } })
  if (!project) {
    return Response.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 })
  }

  const [scripts, experiences] = await Promise.all([
    prisma.callScript.findMany({
      where: { projectCardId: id, status: 'saved' },
      include: { reactions: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.experience.findMany({
      where: { projectCardId: id },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const { system, userMessage } = question
    ? buildFollowUpPrompt(project, scripts, experiences, question)
    : buildSynthesisPrompt(project, scripts, experiences)

  const result = await getAIResponse({ systemPrompt: system, userMessage })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 503 })
  }

  return Response.json({
    data: {
      text: result.data,
      scriptCount: scripts.length,
      experienceCount: experiences.length,
      hasTeamData: scripts.length > 0 || experiences.length > 0,
    },
  })
}
