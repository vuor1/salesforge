import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function DELETE(req, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  await prisma.userProject.deleteMany({
    where: { userId: session.user.id, projectCardId: projectId },
  })

  return NextResponse.json({ ok: true })
}
