const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

require('dotenv/config')

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const hash = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@salesforge.fi' },
    update: {},
    create: {
      email: 'admin@salesforge.fi',
      name: 'Admin',
      password: hash,
      role: 'admin',
      language: 'fi',
    },
  })

  console.log('✅ Seed valmis: admin@salesforge.fi / admin123')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
