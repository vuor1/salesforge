import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/api-auth'

const VALID_CATEGORIES = ['raha', 'mindset', 'myynti', 'elämäntaidot', 'suhteet']

export async function GET(request) {
  const { response } = await requireAuth()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const where = category && VALID_CATEGORIES.includes(category) ? { category } : {}

  const sessions = await prisma.growthClubSession.findMany({
    where,
    orderBy: { sessionDate: 'desc' },
  })

  return Response.json({ data: sessions })
}

export async function POST(request) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { title, category, content, sessionDate } = await request.json()

  if (!title?.trim() || !category || !content?.trim() || !sessionDate) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'title, category, content ja sessionDate ovat pakollisia' } },
      { status: 400 }
    )
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: `category tulee olla: ${VALID_CATEGORIES.join(', ')}` } },
      { status: 400 }
    )
  }

  const session = await prisma.growthClubSession.create({
    data: {
      title: title.trim(),
      category,
      content: content.trim(),
      sessionDate: new Date(sessionDate),
    },
  })

  return Response.json({ data: session }, { status: 201 })
}
