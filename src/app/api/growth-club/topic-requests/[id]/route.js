import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-auth'

export async function PATCH(request, { params }) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { id } = await params
  const { status } = await request.json()

  if (!['pending', 'done'].includes(status)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'status tulee olla: pending tai done' } },
      { status: 400 }
    )
  }

  const existing = await prisma.growthClubTopicRequest.findUnique({ where: { id } })
  if (!existing) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Topic request not found' } },
      { status: 404 }
    )
  }

  const updated = await prisma.growthClubTopicRequest.update({
    where: { id },
    data: { status },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return Response.json({ data: updated })
}
