import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/api-auth'

const VALID_CHANNELS = ['linkedin', 'email', 'sms', 'phone']

export async function GET(request) {
  const { response } = await requireAuth()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'projectId on pakollinen' } },
      { status: 400 }
    )
  }

  const templates = await prisma.messageTemplate.findMany({
    where: { projectCardId: projectId },
    orderBy: [{ channel: 'asc' }, { createdAt: 'asc' }],
  })

  return Response.json({ data: templates })
}

export async function POST(request) {
  const { response } = await requireRole('admin', 'ae')
  if (response) return response

  const { title, channel, body, projectCardId } = await request.json()

  if (!projectCardId) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'projectCardId on pakollinen' } },
      { status: 400 }
    )
  }
  if (!title?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Otsikko on pakollinen' } },
      { status: 400 }
    )
  }
  if (!VALID_CHANNELS.includes(channel)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: `Kanavan tulee olla: ${VALID_CHANNELS.join(', ')}` } },
      { status: 400 }
    )
  }
  if (!body?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Malliteksti on pakollinen' } },
      { status: 400 }
    )
  }

  const template = await prisma.messageTemplate.create({
    data: { title: title.trim(), channel, body: body.trim(), projectCardId },
  })

  return Response.json({ data: template }, { status: 201 })
}
