import { prisma } from '@/lib/prisma'
import ProjectListPanel from '@/components/layout/ProjectListPanel'
import AIPanelWrapper from '@/components/layout/AIPanelWrapper'
import DrawerToggle from '@/components/layout/DrawerToggle'

export default async function ProjectsLayout({ children }) {
  const rawProjects = await prisma.projectCard.findMany({
    select: {
      id: true,
      name: true,
      industry: true,
      _count: { select: { callStories: true } },
    },
    orderBy: { name: 'asc' },
  })

  const projects = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    industry: p.industry,
    storyCount: p._count.callStories,
  }))

  return (
    // Full height below NavBar (NavBar = h-16 = 4rem)
    <div className="flex flex-1 overflow-hidden h-full">

      {/* Left panel — project list (260px, desktop always visible) */}
      <aside
        className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-gray-200 bg-white overflow-hidden"
        aria-label="Projektilista"
      >
        <ProjectListPanel projects={projects} />
      </aside>

      {/* Mobile drawer toggle */}
      <DrawerToggle projects={projects} />

      {/* Center panel — page content */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 overflow-y-auto bg-[#f5f4f0] focus:outline-none"
      >
        {children}
      </main>

      {/* Right panel — AI sparraaja (240px, lg+) */}
      <AIPanelWrapper />
    </div>
  )
}
