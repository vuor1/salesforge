import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import GrowthClubClient from '@/components/GrowthClubClient'

const CATEGORY_LABELS = {
  raha: 'Raha',
  mindset: 'Mindset',
  myynti: 'Myynti',
  elämäntaidot: 'Elämäntaidot',
  suhteet: 'Suhteet',
}

export default async function GrowthClubPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'admin'

  const [sessions, topicRequests] = await Promise.all([
    prisma.growthClubSession.findMany({ orderBy: { sessionDate: 'desc' } }),
    prisma.growthClubTopicRequest.findMany({
      where: isAdmin ? {} : { userId: session?.user?.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <main className="max-w-4xl mx-auto px-6 py-10">
        <GrowthClubClient
          initialSessions={sessions}
          isAdmin={isAdmin}
          categoryLabels={CATEGORY_LABELS}
          initialTopicRequests={topicRequests}
        />
      </main>
    </div>
  )
}
