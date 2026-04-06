import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProjects = await prisma.userProject.findMany({
    where: { userId: session.user.id },
    include: {
      projectCard: {
        include: {
          _count: { select: { bookingTips: true, callStories: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: userProjects.map((up) => up.projectCard) })
}

export async function POST(req) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectCardId } = await req.json()
  if (!projectCardId) return NextResponse.json({ error: 'projectCardId required' }, { status: 400 })

  const up = await prisma.userProject.upsert({
    where: { userId_projectCardId: { userId: session.user.id, projectCardId } },
    create: { userId: session.user.id, projectCardId },
    update: {},
  })

  return NextResponse.json({ data: up }, { status: 201 })
}
