import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id } = await params

  const existing = await prisma.bookingTipLike.findUnique({
    where: { tipId_userId: { tipId: id, userId: session.user.id } },
  })

  if (existing) {
    await prisma.bookingTipLike.delete({
      where: { tipId_userId: { tipId: id, userId: session.user.id } },
    })
    return Response.json({ data: { liked: false } })
  }

  await prisma.bookingTipLike.create({
    data: { tipId: id, userId: session.user.id },
  })
  return Response.json({ data: { liked: true } })
}
