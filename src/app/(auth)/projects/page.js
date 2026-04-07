import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import HomeClient from '@/components/HomeClient'

export default async function ProjectsPage() {
  const session = await auth()

  const [myProjectLinks, allProjects, latestSession] = await Promise.all([
    prisma.userProject.findMany({
      where: { userId: session.user.id },
      include: {
        projectCard: {
          include: {
            _count: { select: { bookingTips: true, callStories: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.projectCard.findMany({
      select: { id: true, name: true, industry: true },
      orderBy: { name: 'asc' },
    }),
    prisma.growthClubSession.findFirst({ orderBy: { sessionDate: 'desc' } }),
  ])

  const myProjectIds = new Set(myProjectLinks.map((up) => up.projectCardId))
  const myProjects = myProjectLinks.map((up) => ({
    ...up.projectCard,
    tipCount: up.projectCard._count.bookingTips,
    storyCount: up.projectCard._count.callStories,
  }))
  const otherProjects = allProjects.filter((p) => !myProjectIds.has(p.id))

  const canManage = ['admin', 'ae'].includes(session?.user?.role)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <HomeClient
        myProjects={myProjects}
        otherProjects={otherProjects}
        latestSession={latestSession}
        canManage={canManage}
      />
    </div>
  )
}
