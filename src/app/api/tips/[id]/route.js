import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function DELETE(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id } = await params

  const tip = await prisma.bookingTip.findUnique({ where: { id } })
  if (!tip) {
    return Response.json({ error: { code: 'NOT_FOUND', message: 'Tip not found' } }, { status: 404 })
  }

  const isOwner = tip.userId === session.user.id
  const isAdmin = session.user.role === 'admin'
  if (!isOwner && !isAdmin) {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'Ei oikeutta poistaa' } }, { status: 403 })
  }

  await prisma.bookingTip.delete({ where: { id } })
  return Response.json({ data: { id } })
}
