import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-auth'

export async function DELETE(request, { params }) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { id } = await params

  const session = await prisma.growthClubSession.findUnique({ where: { id } })
  if (!session) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Session not found' } },
      { status: 404 }
    )
  }

  await prisma.growthClubSession.delete({ where: { id } })
  return Response.json({ data: { id } })
}
