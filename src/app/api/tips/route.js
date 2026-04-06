import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

const VALID_TYPES = ['avaus', 'vastalause', 'lähestymistapa', 'clousaus']

export async function GET(request) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const projectId = searchParams.get('projectId')
  const search = searchParams.get('search')

  const where = {}
  if (type && VALID_TYPES.includes(type)) where.type = type
  if (projectId) where.projectCardId = projectId
  if (search?.trim()) {
    where.OR = [
      { content: { contains: search.trim(), mode: 'insensitive' } },
      { context: { contains: search.trim(), mode: 'insensitive' } },
    ]
  }

  const tips = await prisma.bookingTip.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      projectCard: { select: { id: true, name: true } },
      likedBy: { select: { userId: true } },
    },
    orderBy: [
      { likedBy: { _count: 'desc' } },
      { createdAt: 'desc' },
    ],
  })

  const currentUserId = session.user.id
  const result = tips.map((tip) => ({
    ...tip,
    likeCount: tip.likedBy.length,
    likedByMe: tip.likedBy.some((l) => l.userId === currentUserId),
    likedBy: undefined,
  }))

  return Response.json({ data: result })
}

export async function POST(request) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { type, content, context, projectCardId } = await request.json()

  if (!projectCardId) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'projectCardId on pakollinen' } },
      { status: 400 }
    )
  }
  if (!VALID_TYPES.includes(type)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: `type tulee olla: ${VALID_TYPES.join(', ')}` } },
      { status: 400 }
    )
  }
  if (!content?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Vinkin sisältö on pakollinen' } },
      { status: 400 }
    )
  }
  if (!context?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Selitys (missä tilanteessa / miksi toimi) on pakollinen' } },
      { status: 400 }
    )
  }

  const tip = await prisma.bookingTip.create({
    data: {
      type,
      content: content.trim(),
      context: context.trim(),
      projectCardId,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      projectCard: { select: { id: true, name: true } },
    },
  })

  return Response.json({ data: { ...tip, likeCount: 0, likedByMe: false } }, { status: 201 })
}
