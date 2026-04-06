import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id } = await params

  const scripts = await prisma.callScript.findMany({
    where: {
      projectCardId: id,
      OR: [
        { userId: session.user.id },
        { status: 'saved' },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json({ data: scripts })
}

export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id } = await params
  const { title, opening, objections, closing, status } = await request.json()

  const project = await prisma.projectCard.findUnique({ where: { id } })
  if (!project) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 }
    )
  }

  const script = await prisma.callScript.create({
    data: {
      projectCardId: id,
      userId: session.user.id,
      title: title?.trim() || null,
      opening: opening ?? '',
      objections: objections ?? '',
      closing: closing ?? '',
      status: status ?? 'draft',
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return Response.json({ data: script }, { status: 201 })
}
