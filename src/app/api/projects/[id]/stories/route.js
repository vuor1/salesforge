import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id: projectCardId } = await params
  const { content } = await request.json()

  if (!content?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Story content is required' } },
      { status: 400 }
    )
  }

  const project = await prisma.projectCard.findUnique({ where: { id: projectCardId } })
  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  const story = await prisma.callStory.create({
    data: {
      content: content.trim(),
      projectCardId,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return Response.json({ data: story }, { status: 201 })
}
