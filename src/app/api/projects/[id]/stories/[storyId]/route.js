import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

async function getOwnedStory(storyId, userId) {
  const story = await prisma.callStory.findUnique({ where: { id: storyId } })
  if (!story) return { story: null, error: 'NOT_FOUND' }
  if (story.userId !== userId) return { story: null, error: 'FORBIDDEN' }
  return { story, error: null }
}

export async function PATCH(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { storyId } = await params
  const { content } = await request.json()

  if (!content?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Content is required' } },
      { status: 400 }
    )
  }

  const { story, error } = await getOwnedStory(storyId, session.user.id)
  if (error === 'NOT_FOUND') {
    return Response.json({ error: { code: 'NOT_FOUND', message: 'Story not found' } }, { status: 404 })
  }
  if (error === 'FORBIDDEN') {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'You can only edit your own stories' } }, { status: 403 })
  }

  const updated = await prisma.callStory.update({
    where: { id: storyId },
    data: { content: content.trim() },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return Response.json({ data: updated })
}

export async function DELETE(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { storyId } = await params

  const { story, error } = await getOwnedStory(storyId, session.user.id)
  if (error === 'NOT_FOUND') {
    return Response.json({ error: { code: 'NOT_FOUND', message: 'Story not found' } }, { status: 404 })
  }
  if (error === 'FORBIDDEN') {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own stories' } }, { status: 403 })
  }

  await prisma.callStory.delete({ where: { id: storyId } })

  return Response.json({ data: { deleted: true } })
}
