import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/api-auth'

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

export async function POST(request) {
  const { session, response } = await requireRole('admin', 'ae')
  if (response) return response

  const { name, industry, callAngle, callHistorySummary } = await request.json()

  if (!name?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Projektin nimi on pakollinen' } },
      { status: 400 }
    )
  }
  if (!industry?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Toimiala on pakollinen' } },
      { status: 400 }
    )
  }

  const existing = await prisma.projectCard.findUnique({ where: { name: name.trim() } })
  if (existing) {
    return Response.json(
      { error: { code: 'CONFLICT', message: 'Projekti tällä nimellä on jo olemassa' } },
      { status: 409 }
    )
  }

  const project = await prisma.projectCard.create({
    data: {
      name: name.trim(),
      industry: industry.trim(),
      callAngle: callAngle?.trim() || null,
      callHistorySummary: callHistorySummary?.trim() || null,
    },
  })

  return Response.json({ data: project }, { status: 201 })
}
