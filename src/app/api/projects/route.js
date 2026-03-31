import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request) {
  const { response } = await requireAuth()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() ?? ''

  const projects = await prisma.projectCard.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { industry: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      _count: { select: { callStories: true } },
    },
    orderBy: { name: 'asc' },
  })

  const data = projects.map((p) => ({
    id: p.id,
    name: p.name,
    industry: p.industry,
    callAngle: p.callAngle,
    storyCount: p._count.callStories,
    createdAt: p.createdAt,
  }))

  return Response.json({ data })
}
