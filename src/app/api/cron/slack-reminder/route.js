import { prisma } from '@/lib/prisma'
import { sendSlackMessage } from '@/lib/slack'

// Finnish public holidays 2026 (YYYY-MM-DD)
const FI_HOLIDAYS_2026 = new Set([
  '2026-01-01', // Uudenvuodenpäivä
  '2026-01-06', // Loppiainen
  '2026-04-03', // Pitkäperjantai
  '2026-04-06', // Pääsiäissunnuntai
  '2026-04-07', // 2. pääsiäispäivä
  '2026-05-01', // Vappu
  '2026-05-14', // Helatorstai
  '2026-05-24', // Helluntaipäivä
  '2026-06-19', // Juhannusaatto
  '2026-06-20', // Juhannuspäivä
  '2026-11-07', // Pyhäinpäivä
  '2026-12-06', // Itsenäisyyspäivä
  '2026-12-24', // Jouluaatto
  '2026-12-25', // Joulupäivä
  '2026-12-26', // Tapaninpäivä
])

function isTodayWorkday() {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const dateStr = now.toISOString().slice(0, 10)
  return !FI_HOLIDAYS_2026.has(dateStr)
}

function getTodayBounds() {
  const now = new Date()
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59))
  return { startOfDay, endOfDay }
}

// GET /api/cron/slack-reminder
// Called by Vercel Cron at 14:30 UTC (= 16:30 EET)
export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isTodayWorkday()) {
    return Response.json({ data: { skipped: 'weekend or holiday', sent: 0 } })
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return Response.json({ error: { code: 'NOT_CONFIGURED', message: 'SLACK_WEBHOOK_URL not set' } }, { status: 500 })
  }

  const { startOfDay, endOfDay } = getTodayBounds()

  // Find all project card views from today
  const views = await prisma.userProjectView.findMany({
    where: { viewedAt: { gte: startOfDay, lte: endOfDay } },
    include: {
      user: { select: { id: true, name: true, email: true, slackUserId: true } },
      projectCard: { select: { id: true, name: true } },
    },
  })

  if (views.length === 0) {
    return Response.json({ data: { sent: 0, reason: 'no views today' } })
  }

  // Group by user
  const byUser = {}
  for (const view of views) {
    const uid = view.user.id
    if (!byUser[uid]) byUser[uid] = { user: view.user, projects: new Map() }
    byUser[uid].projects.set(view.projectCard.id, view.projectCard)
  }

  // Find today's experiences per user
  const experiences = await prisma.experience.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    select: { authorId: true, projectCardId: true },
  })

  const experiencedProjects = new Set(
    experiences.map((e) => `${e.authorId}:${e.projectCardId}`)
  )

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://salesforge-j6hv.vercel.app'
  let sent = 0

  for (const { user, projects } of Object.values(byUser)) {
    if (!user.slackUserId) continue // no Slack ID configured

    // Filter to projects without a logged experience today
    const pending = [...projects.values()].filter(
      (p) => !experiencedProjects.has(`${user.id}:${p.id}`)
    )

    if (pending.length === 0) continue

    const projectLinks = pending
      .map((p) => `• <${appUrl}/projects/${p.id}|${p.name}>`)
      .join('\n')

    const message = pending.length === 1
      ? `🎯 Miten meni soitto *${pending[0].name}* -projektiin?\nKirjaa kokemus ennen kuin se unohtuu:\n${projectLinks}`
      : `🎯 Sinulla on ${pending.length} projektia ilman kirjausta tänään:\n${projectLinks}\n\nKirjaa kokemuksesi — tiimi oppii jokaisesta soitosta!`

    await sendSlackMessage({ webhookUrl, message })
    sent++
  }

  return Response.json({ data: { sent, usersChecked: Object.keys(byUser).length } })
}
