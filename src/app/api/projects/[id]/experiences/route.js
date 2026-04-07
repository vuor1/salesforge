import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/projects/[id]/experiences
// Body: { scriptId, content, score? }
export async function POST(request, { params }) {
  const { session, response } = await requireAuth()
  if (response) return response

  const { id: projectCardId } = await params
  const { scriptId, content, score } = await request.json()

  if (!scriptId?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'scriptId is required' } },
      { status: 400 }
    )
  }
  if (!content?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'content is required' } },
      { status: 400 }
    )
  }
  if (score !== undefined && score !== null && (score < 1 || score > 5 || !Number.isInteger(score))) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'score must be an integer 1–5' } },
      { status: 400 }
    )
  }

  // Upsert: one experience per user per script
  const existing = await prisma.experience.findFirst({
    where: { callScriptId: scriptId, authorId: session.user.id },
  })

  let experience
  if (existing) {
    experience = await prisma.experience.update({
      where: { id: existing.id },
      data: {
        content: content.trim(),
        score: score ?? null,
      },
    })
  } else {
    experience = await prisma.experience.create({
      data: {
        callScriptId: scriptId,
        projectCardId,
        authorId: session.user.id,
        content: content.trim(),
        score: score ?? null,
      },
    })
  }

  return Response.json({ data: experience }, { status: existing ? 200 : 201 })
}

// GET /api/projects/[id]/experiences
// Returns all experiences for the project, grouped by scriptId
export async function GET(request, { params }) {
  const { response } = await requireAuth()
  if (response) return response

  const { id: projectCardId } = await params

  const experiences = await prisma.experience.findMany({
    where: { projectCardId },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ data: experiences })
}
