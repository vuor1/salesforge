import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import ProjectPageClient from '@/components/ProjectPageClient'

export default async function ProjectCardPage({ params }) {
  const { id } = await params
  const session = await auth()

  const [project, tips, stories, templates] = await Promise.all([
    prisma.projectCard.findUnique({ where: { id } }),
    prisma.bookingTip.findMany({
      where: { projectCardId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        likedBy: { select: { userId: true } },
      },
      orderBy: [{ likedBy: { _count: 'desc' } }, { createdAt: 'desc' }],
    }),
    prisma.callStory.findMany({
      where: { projectCardId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.messageTemplate.findMany({
      where: { projectCardId: id },
      orderBy: [{ channel: 'asc' }, { createdAt: 'asc' }],
    }),
  ])

  if (!project) notFound()

  const currentUserId = session?.user?.id
  const canManage = ['admin', 'ae'].includes(session?.user?.role)

  const initialTips = tips.map((tip) => ({
    ...tip,
    likeCount: tip.likedBy.length,
    likedByMe: tip.likedBy.some((l) => l.userId === currentUserId),
    likedBy: undefined,
  }))

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <main className="max-w-4xl mx-auto px-6 py-10">
        <ProjectPageClient
          project={project}
          initialTips={initialTips}
          initialStories={stories}
          initialTemplates={templates}
          currentUserId={currentUserId}
          canManage={canManage}
        />
      </main>
    </div>
  )
}
