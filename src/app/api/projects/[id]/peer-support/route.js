import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { buildPeerSupportMessage, sendSlackMessage } from '@/lib/slack'

const VALID_ADVICE_TYPES = ['soittorunko', 'viestimalli', 'yleinen']

export async function GET(request, { params }) {
  const { response } = await requireAuth()
  if (response) return response

  const { id } = await params

  const requests = await prisma.peerSupportRequest.findMany({
    where: { projectCardId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      answers: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ data: requests })
}

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id } = await params
  const { adviceType, description } = await request.json()

  if (!VALID_ADVICE_TYPES.includes(adviceType)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: `adviceType tulee olla: ${VALID_ADVICE_TYPES.join(', ')}` } },
      { status: 400 }
    )
  }

  const project = await prisma.projectCard.findUnique({ where: { id } })
  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  const peerRequest = await prisma.peerSupportRequest.create({
    data: {
      projectCardId: id,
      userId: session.user.id,
      adviceType,
      description: description?.trim() || null,
      status: 'pending',
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      answers: [],
    },
  })

  // Slack targeting: story authors first, fallback to same role
  let slackNotified = false
  try {
    const storyAuthorRows = await prisma.callStory.findMany({
      where: { projectCardId: id, userId: { not: session.user.id } },
      select: { userId: true },
      distinct: ['userId'],
    })
    const storyAuthorIds = storyAuthorRows.map((r) => r.userId)

    const targets = storyAuthorIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: storyAuthorIds }, isActive: true } })
      : await prisma.user.findMany({ where: { role: session.user.role, id: { not: session.user.id }, isActive: true } })

    if (targets.length > 0) {
      const requesterName = session.user.name ?? session.user.email.split('@')[0]
      const projectUrl = `${process.env.NEXTAUTH_URL}/projects/${id}`
      const message = buildPeerSupportMessage({
        requester: requesterName,
        project: project.name,
        adviceType,
        description: description?.trim() || null,
        projectUrl,
      })
      const result = await sendSlackMessage({ webhookUrl: process.env.SLACK_WEBHOOK_URL, message })
      slackNotified = !result.error
    }
  } catch {
    // Slack failure must not block the response
  }

  return Response.json({ data: { ...peerRequest, slackNotified } }, { status: 201 })
}
