import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-auth'

const VALID_CHANNELS = ['linkedin', 'email', 'sms', 'phone']

export async function PATCH(request, { params }) {
  const { response } = await requireRole('admin', 'ae')
  if (response) return response

  const { id } = await params
  const { title, channel, body } = await request.json()

  const template = await prisma.messageTemplate.findUnique({ where: { id } })
  if (!template) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Template not found' } },
      { status: 404 }
    )
  }

  if (channel !== undefined && !VALID_CHANNELS.includes(channel)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: `Kanavan tulee olla: ${VALID_CHANNELS.join(', ')}` } },
      { status: 400 }
    )
  }

  const updated = await prisma.messageTemplate.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(channel !== undefined && { channel }),
      ...(body !== undefined && { body: body.trim() }),
    },
  })

  return Response.json({ data: updated })
}

export async function DELETE(request, { params }) {
  const { response } = await requireRole('admin', 'ae')
  if (response) return response

  const { id } = await params

  const template = await prisma.messageTemplate.findUnique({ where: { id } })
  if (!template) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Template not found' } },
      { status: 404 }
    )
  }

  await prisma.messageTemplate.delete({ where: { id } })

  return Response.json({ data: { deleted: true } })
}
