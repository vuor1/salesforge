import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/api-auth'

export async function GET(request) {
  const { session, response } = await requireAuth()
  if (response) return response

  const isAdmin = session.user.role === 'admin'

  const requests = await prisma.growthClubTopicRequest.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ data: requests })
}

export async function POST(request) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { content } = await request.json()

  if (!content?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Aiheen sisältö on pakollinen' } },
      { status: 400 }
    )
  }

  const topicRequest = await prisma.growthClubTopicRequest.create({
    data: {
      content: content.trim(),
      userId: session.user.id,
      status: 'pending',
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return Response.json({ data: topicRequest }, { status: 201 })
}
