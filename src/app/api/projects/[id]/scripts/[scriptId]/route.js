import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

async function getOwnedScript(scriptId, userId) {
  const script = await prisma.callScript.findUnique({ where: { id: scriptId } })
  if (!script) return { script: null, error: 'NOT_FOUND' }
  if (script.userId !== userId) return { script: null, error: 'FORBIDDEN' }
  return { script, error: null }
}

export async function PATCH(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { scriptId } = await params
  const body = await request.json()

  const { script, error } = await getOwnedScript(scriptId, session.user.id)
  if (error === 'NOT_FOUND') {
    return Response.json({ error: { code: 'NOT_FOUND', message: 'Script not found' } }, { status: 404 })
  }
  if (error === 'FORBIDDEN') {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'You can only edit your own scripts' } }, { status: 403 })
  }

  const updated = await prisma.callScript.update({
    where: { id: scriptId },
    data: {
      ...(body.title !== undefined && { title: body.title?.trim() || null }),
      ...(body.opening !== undefined && { opening: body.opening }),
      ...(body.objections !== undefined && { objections: body.objections }),
      ...(body.closing !== undefined && { closing: body.closing }),
      ...(body.status !== undefined && { status: body.status }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return Response.json({ data: updated })
}

export async function DELETE(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { scriptId } = await params

  const { error } = await getOwnedScript(scriptId, session.user.id)
  if (error === 'NOT_FOUND') {
    return Response.json({ error: { code: 'NOT_FOUND', message: 'Script not found' } }, { status: 404 })
  }
  if (error === 'FORBIDDEN') {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own scripts' } }, { status: 403 })
  }

  await prisma.callScript.delete({ where: { id: scriptId } })

  return Response.json({ data: { deleted: true } })
}
