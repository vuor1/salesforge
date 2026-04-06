import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request) {
  const { response } = await requireAuth()
  if (response) return response

  const scripts = await prisma.callScript.findMany({
    where: { status: 'saved' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      projectCard: { select: { id: true, name: true, industry: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json({ data: scripts })
}
