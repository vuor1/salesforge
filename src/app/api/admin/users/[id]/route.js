import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-auth'

export async function PATCH(request, { params }) {
  const { session, response } = await requireRole('admin')
  if (response) return response

  const { id } = await params
  const body = await request.json()
  const { role, isActive, slackUserId } = body

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    )
  }

  // Prevent admin from deactivating themselves
  if (session.user.id === id && isActive === false) {
    return Response.json(
      { error: { code: 'FORBIDDEN', message: 'You cannot deactivate your own account' } },
      { status: 403 }
    )
  }

  const validRoles = ['sdr', 'ae', 'team_lead', 'admin']
  const updateData = {}
  if (role !== undefined && validRoles.includes(role)) updateData.role = role
  if (isActive !== undefined && typeof isActive === 'boolean') updateData.isActive = isActive
  if (slackUserId !== undefined) updateData.slackUserId = slackUserId ?? null

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      language: true,
      slackUserId: true,
      createdAt: true,
    },
  })

  return Response.json({ data: updated })
}
