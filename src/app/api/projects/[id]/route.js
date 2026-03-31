import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request, { params }) {
  const { response } = await requireAuth()
  if (response) return response

  const { id } = await params

  const project = await prisma.projectCard.findUnique({
    where: { id },
    include: {
      callStories: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { callStories: true } },
    },
  })

  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  return Response.json({ data: project })
}
