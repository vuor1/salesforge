import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function formatDate(date) {
  return new Date(date).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function authorName(user) {
  return user.name ?? user.email.split('@')[0]
}

export default async function ProjectCardPage({ params }) {
  const { id } = await params
  const session = await auth()

  const project = await prisma.projectCard.findUnique({
    where: { id },
    include: {
      callStories: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) notFound()

  const currentUserId = session?.user?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/projects" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Projektit
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Projektin perustiedot */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{project.industry}</p>
            </div>
          </div>

          {project.callAngle && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Soittokulma
              </p>
              <p className="text-sm text-gray-800">{project.callAngle}</p>
            </div>
          )}

          {project.callHistorySummary && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Soittohistoria
              </p>
              <p className="text-sm text-gray-800">{project.callHistorySummary}</p>
            </div>
          )}
        </div>

        {/* Soittotarinat */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              Soittotarinat
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({project.callStories.length})
              </span>
            </h3>
            <Link
              href={`/projects/${id}/add-story`}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              + Lisää tarina
            </Link>
          </div>

          {project.callStories.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500 font-medium">Ei soittotarinoita vielä</p>
              <p className="text-gray-400 text-sm mt-1">
                Oletko soittanut tähän projektiin? Jaa kokemuksesi tiimille.
              </p>
              <Link
                href={`/projects/${id}/add-story`}
                className="inline-block mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Ole ensimmäinen — lisää soittotarina
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {project.callStories.map((story) => (
                <li
                  key={story.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {authorName(story.user)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{formatDate(story.createdAt)}</span>
                      {story.user.id === currentUserId && (
                        <Link
                          href={`/projects/${id}/stories/${story.id}/edit`}
                          className="text-xs text-gray-400 hover:text-gray-700 underline"
                        >
                          Muokkaa
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{story.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
