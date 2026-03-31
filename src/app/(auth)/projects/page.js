import { prisma } from '@/lib/prisma'
import ProjectSearch from '@/components/ProjectSearch'

export default async function ProjectsPage() {
  const projects = await prisma.projectCard.findMany({
    include: { _count: { select: { callStories: true } } },
    orderBy: { name: 'asc' },
  })

  const initialProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    industry: p.industry,
    callAngle: p.callAngle,
    storyCount: p._count.callStories,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Projektit</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProjectSearch initialProjects={initialProjects} />
      </main>
    </div>
  )
}
