import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id, requestId } = await params
  const { content } = await request.json()

  if (!content?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Vastauksen sisältö on pakollinen' } },
      { status: 400 }
    )
  }

  const peerRequest = await prisma.peerSupportRequest.findUnique({
    where: { id: requestId },
  })

  if (!peerRequest || peerRequest.projectCardId !== id) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Peer support request not found' } },
      { status: 404 }
    )
  }

  if (peerRequest.userId === session.user.id) {
    return Response.json(
      { error: { code: 'FORBIDDEN', message: 'Et voi vastata omaan pyyntöösi' } },
      { status: 403 }
    )
  }

  const [answer] = await prisma.$transaction([
    prisma.peerSupportAnswer.create({
      data: {
        peerSupportRequestId: requestId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.peerSupportRequest.update({
      where: { id: requestId },
      data: { status: 'answered' },
    }),
  ])

  return Response.json({ data: answer }, { status: 201 })
}
