const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

require('dotenv/config')

const templates = [
  // LinkedIn
  {
    channel: 'linkedin',
    title: 'Kylmäyhteydenotto — ongelmalähtöinen',
    language: 'fi',
    body: `Hei [Nimi],

Huomasin, että [Yritys] on kasvattanut toimintaansa [toimiala]-alueella. Monissa samankaltaisissa yrityksissä olemme auttaneet ratkaisemaan [ongelma].

Olisiko sinulla hetki tällä viikolla kuulla lyhyesti, miten voisimme tukea teidänkin kasvua?

Terveisin,
[Oma nimi]`,
  },
  {
    channel: 'linkedin',
    title: 'Follow-up yhteydenottoon',
    language: 'fi',
    body: `Hei [Nimi],

Laitoin viestiä viikko sitten liittyen [aihe]. Halusin varmistaa, ettei viestini hukkunut.

Ymmärrän, että kalenterisi on täynnä — siksi lupaan pitää sen lyhyenä: 15 minuuttia, ei slideshow-esitystä.

Onko teillä sopiva hetki tällä tai ensi viikolla?`,
  },
  {
    channel: 'linkedin',
    title: 'Arvo-viesti — case study',
    language: 'fi',
    body: `Hei [Nimi],

Autoimme hiljattain [samankaltainen yritys] saavuttamaan [tulos, esim. 30% tehokkuusparannus] [aikaväli].

Uskon, että teillä on samankaltainen mahdollisuus. Voisimme jakaa lähestymistapamme 20 minuutin puhelussa.

Kiinnostaako?`,
  },

  // Email
  {
    channel: 'email',
    title: 'Kylmäsähköposti — lyhyt ja ytimekäs',
    language: 'fi',
    body: `Aihe: [Yritys] + [Oma yritys] — nopea ajatus

Hei [Nimi],

[Yritys] tekee vaikuttavaa työtä [toimiala]:lla. Autamme yrityksiä kuten teidän ratkaisemaan [haaste] — tyypillisesti [konkreettinen tulos].

Olisiko 15 min puhelulle tilaa kalenterissasi ensi viikolla?

[Oma nimi]
[Titteli] | Strongest Group`,
  },
  {
    channel: 'email',
    title: 'Follow-up — kaksi vaihtoehtoa',
    language: 'fi',
    body: `Aihe: Re: [aihe]

Hei [Nimi],

Palataan asiaan — tiedän, että sähköpostit kasaantuvat.

Onko teillä jokin näistä ajankohdista sopiva?
• [Päivä] klo [aika]
• [Päivä] klo [aika]

Jos ajankohta ei sovi, voit varata ajan suoraan kalenteristani: [linkki]

[Oma nimi]`,
  },
  {
    channel: 'email',
    title: 'Tapaamisen vahvistus',
    language: 'fi',
    body: `Aihe: Vahvistus: [Yritys] + Strongest Group [päivä] klo [aika]

Hei [Nimi],

Hienoa, että löysimme ajan! Vahvistan tapaamisen:

📅 [Päivämäärä] klo [aika]
📍 [Paikka / Teams-linkki]

Valmistaudun erityisesti [aihe/kysymys]. Jos haluat, voin lähettää etukäteen lyhyen agendan.

Nähdään pian!
[Oma nimi]`,
  },

  // SMS
  {
    channel: 'sms',
    title: 'Tapaamisen muistutus',
    language: 'fi',
    body: `Hei [Nimi]! Muistutus huomisesta tapaamisestamme klo [aika]. Nähdään [paikka/Teams]. Jos muutos tulee, soita tai laita viestiä. — [Oma nimi], Strongest Group`,
  },
  {
    channel: 'sms',
    title: 'Nopea follow-up puhelun jälkeen',
    language: 'fi',
    body: `Hei [Nimi], kiitos puhelusta! Lähetän lupaamani [materiaali/tarjous] sähköpostitse. Tavoitteena oli [sovittu asia] — palataan asiaan [ajankohta]. — [Oma nimi]`,
  },
  {
    channel: 'sms',
    title: 'Puhelun yhteydenotto',
    language: 'fi',
    body: `Hei [Nimi], soitin äsken mutta ei vastannut. Olisiko hyvä hetki puhua [aihe]:sta? Voin soittaa uudestaan — kerro sopiva aika. — [Oma nimi], Strongest Group`,
  },

  // Phone
  {
    channel: 'phone',
    title: 'Avausskripti — portinvartija',
    language: 'fi',
    body: `"Hei, nimeni on [Nimi] Strongest Groupilta. Soitan [Päättäjän nimi]:lle — onko hän tavoitettavissa?"

[Jos kysytään syytä:]
"Soitan lyhyen kysymyksen liittyen [toimiala]-alan [haaste]. Olisi hyvä kuulla suoraan häneltä, onko tämä teille ajankohtaista."`,
  },
  {
    channel: 'phone',
    title: 'Avausskripti — päättäjä vastaa',
    language: 'fi',
    body: `"Hei [Nimi], nimeni on [Oma nimi] Strongest Groupilta. Soitan, koska autamme [toimiala]-yrityksiä [tulos/hyöty]. Onko tämä teille ajankohtainen aihe?"

[Jos kyllä:] "Hienoa! Olisiko teillä 15 minuuttia ensi viikolla, että voisin kertoa tarkemmin?"

[Jos ei:] "Ymmärrän — milloin olisi parempi aika palata asiaan?"`,
  },
  {
    channel: 'phone',
    title: 'Vastaväite: "Ei kiinnosta"',
    language: 'fi',
    body: `"Täysin ymmärrettävää — en halua viedä aikaasi turhaan. Saanko kysyä: onko [ongelma] teillä jo ratkaistu, vai eikö se vain ole prioriteetti tällä hetkellä?"

[Jos ei ratkaistu:] "Juuri siitä halusin puhua — meillä on lähestymistapa joka on toiminut [samankaltaiselle yritykselle]."`,
  },
]

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  let count = 0
  for (const t of templates) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { channel: t.channel, title: t.title },
    })
    if (!existing) {
      await prisma.messageTemplate.create({ data: t })
      count++
    }
  }

  console.log(`✅ Viestimallit: ${count} uutta mallia luotu (${templates.length} yhteensä)`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
