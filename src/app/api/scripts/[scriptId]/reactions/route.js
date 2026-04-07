import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { sendSlackMessage } from '@/lib/slack'

// POST /api/scripts/[scriptId]/reactions — toggle reaction (add or remove)
export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { scriptId } = await params

  const script = await prisma.callScript.findUnique({
    where: { id: scriptId },
    include: { user: { select: { id: true, name: true, slackUserId: true } } },
  })

  if (!script) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Script not found' } },
      { status: 404 }
    )
  }

  const existing = await prisma.reaction.findUnique({
    where: { callScriptId_userId: { callScriptId: scriptId, userId: session.user.id } },
  })

  if (existing) {
    // Toggle off
    await prisma.reaction.delete({ where: { id: existing.id } })
    const count = await prisma.reaction.count({ where: { callScriptId: scriptId } })
    return Response.json({ data: { reacted: false, count } })
  }

  // Toggle on
  await prisma.reaction.create({
    data: { callScriptId: scriptId, userId: session.user.id },
  })
  const count = await prisma.reaction.count({ where: { callScriptId: scriptId } })

  // Slack notification to script author (not for own reactions)
  const isOwnScript = script.user.id === session.user.id
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!isOwnScript && script.user.slackUserId && webhookUrl) {
    const reactorName = session.user.name ?? session.user.email
    const projectCard = await prisma.projectCard.findUnique({ where: { id: script.projectCardId } })
    await sendSlackMessage({
      webhookUrl,
      message: `👍 *${reactorName}* reagoi soittorunkooosi projektissa *${projectCard?.name ?? ''}*`,
    })
  }

  return Response.json({ data: { reacted: true, count } })
}
