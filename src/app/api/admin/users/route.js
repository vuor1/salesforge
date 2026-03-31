import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const { session, response } = await requireRole('admin')
  if (response) return response

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      language: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json({ data: users })
}

export async function POST(request) {
  const { session, response } = await requireRole('admin')
  if (response) return response

  const body = await request.json()
  const { email, name, password, role, language } = body

  if (!email || !password) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json(
      { error: { code: 'CONFLICT', message: 'User with this email already exists' } },
      { status: 409 }
    )
  }

  const validRoles = ['sdr', 'ae', 'team_lead', 'admin']
  const userRole = validRoles.includes(role) ? role : 'sdr'

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashedPassword,
      role: userRole,
      language: language || 'fi',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      language: true,
      createdAt: true,
    },
  })

  return Response.json({ data: user }, { status: 201 })
}
