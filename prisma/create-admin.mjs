import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const hash = await bcrypt.hash('Fe6ieyai!', 12)
const user = await prisma.user.upsert({
  where: { email: 'otto.vuori@strongest.fi' },
  update: { password: hash, role: 'admin', isActive: true },
  create: {
    email: 'otto.vuori@strongest.fi',
    name: 'Otto Vuori',
    password: hash,
    role: 'admin',
    isActive: true,
  },
})
console.log('✓ Käyttäjä luotu:', user.email, '/', user.role)
await prisma.$disconnect()
