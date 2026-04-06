import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/api-auth'

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

export async function PATCH(request, { params }) {
  const { response } = await requireRole('admin', 'ae')
  if (response) return response

  const { id } = await params
  const { industry, callAngle, callHistorySummary } = await request.json()

  const project = await prisma.projectCard.findUnique({ where: { id } })
  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  const updated = await prisma.projectCard.update({
    where: { id },
    data: {
      ...(industry !== undefined && { industry: industry.trim() }),
      ...(callAngle !== undefined && { callAngle: callAngle?.trim() || null }),
      ...(callHistorySummary !== undefined && { callHistorySummary: callHistorySummary?.trim() || null }),
    },
  })

  return Response.json({ data: updated })
}
