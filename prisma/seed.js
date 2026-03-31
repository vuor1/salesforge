const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

require('dotenv/config')

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  // Admin user
  const hash = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'otto.vuori@strongest.fi' },
    update: {},
    create: {
      email: 'otto.vuori@strongest.fi',
      name: 'Otto Vuori',
      password: hash,
      role: 'admin',
      language: 'fi',
    },
  })

  // Demo SDR user
  const sdrHash = await bcrypt.hash('sdr12345', 12)
  await prisma.user.upsert({
    where: { email: 'mikko.makinen@strongest.fi' },
    update: {},
    create: {
      email: 'mikko.makinen@strongest.fi',
      name: 'Mikko Mäkinen',
      password: sdrHash,
      role: 'sdr',
      language: 'fi',
    },
  })

  // Sample projects
  const projects = [
    {
      name: 'Fortum Oyj',
      industry: 'Energia',
      callAngle: 'Kestävä energiasiirtymä ja kustannussäästöt teollisuudelle',
      callHistorySummary: 'Positiivinen vastaanotto Q4 2025, päättäjä on CFO',
    },
    {
      name: 'Stora Enso',
      industry: 'Metsäteollisuus',
      callAngle: 'Digitalisaatio ja prosessitehokkuus tuotannossa',
      callHistorySummary: null,
    },
    {
      name: 'Wärtsilä',
      industry: 'Meriteollisuus',
      callAngle: 'Vihreä siirtymä ja hybridiratkaisut laivamoottoreille',
      callHistorySummary: 'CTO kiinnostunut, demo sovittu Q1 2026',
    },
    {
      name: 'Konecranes',
      industry: 'Nostolaitteet ja teollisuus',
      callAngle: 'Älynostimet ja ennakkohuolto IoT-datalla',
      callHistorySummary: null,
    },
    {
      name: 'Neste Oyj',
      industry: 'Öljynjalostus ja uusiutuva energia',
      callAngle: 'Uusiutuvan dieselin toimitusketjun optimointi',
      callHistorySummary: 'Pitkä myyntisykli, budjetti Q3 2026',
    },
  ]

  for (const p of projects) {
    await prisma.projectCard.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    })
  }

  console.log('✅ Seed valmis:')
  console.log('   otto.vuori@strongest.fi / admin123')
  console.log('   mikko.makinen@strongest.fi / sdr12345')
  console.log(`   ${projects.length} esimerkkiprojektia luotu`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
