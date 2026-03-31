/**
 * Strongest Group Oy — asiakkaiden tuontiskripti
 * Ajo: node prisma/import-clients.js
 *
 * Turvallinen ajaa useita kertoja (upsert, ei duplikaatteja).
 */

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

require('dotenv/config')

const clients = [
  { name: 'Nets', industry: 'Maksupalvelut / Fintech', callAngle: 'Jatkuva yhteistyö, iso volyymi (60–150 tap/kk)' },
  { name: 'Terveystalo', industry: 'Työterveyspalvelut', callAngle: 'Suurasiakassegmentti' },
  { name: 'FabricAI', industry: 'AI / Tech', callAngle: '80 tapaamista H1' },
  { name: 'Mercuri International', industry: 'Myyntikoulutus', callAngle: 'Kansainvälinen talo, tyytyväinen asiakas – upsell' },
  { name: 'Tietokeskus & Dell', industry: 'IT-infrastruktuuri', callAngle: 'SMB-segmentti, IT-päättäjät / CIO' },
  { name: 'Telia Cygate & Fortinet', industry: 'Kyberturvallisuus / Telecom', callAngle: 'Onnistuneen 30 tap projektin jatko → 50 tap' },
  { name: 'Exclusive Networks & Fortinet', industry: 'Kyberturvallisuus', callAngle: 'Jatkoprojekti yhteistyön ylläpidon kautta' },
  { name: 'Netskope', industry: 'Kyberturvallisuus (SaaS)', callAngle: '15 tapaamisen pilotti' },
  { name: 'Visma Netvisor', industry: 'Taloushallinto-ohjelmisto', callAngle: 'Palaava asiakas, 50 tapaamista' },
  { name: 'Visma Fikuro', industry: 'Taloushallinto-ohjelmisto', callAngle: 'Tyytyväinen asiakas, jatkaa' },
  { name: 'Visma Amplio', industry: 'Taloushallinto-ohjelmisto', callAngle: 'Suositusten kautta (Visma Solutions + Avalosys)' },
  { name: 'Vapaus.io', industry: 'HR-etu / Pyörätyösuhde-etu', callAngle: '20 tap/kk + lisäkampanja + HubSpot-kirjaukset' },
  { name: 'ISS', industry: 'Facility management', callAngle: 'Toistuvat upsell-ostot, tulokset hyviä' },
  { name: 'BearingPoint', industry: 'Konsultointi / Risk management', callAngle: 'Uusi risk management -kampanja vanhan rinnalle' },
  { name: 'Solidice', industry: 'IT-konsultointi (M365, Copilot, Azure)', callAngle: 'Reaktor Ecosystem, eka soitto eka projekti' },
  { name: 'FusionID', industry: 'Tietoturva / IAM-konsultointi', callAngle: 'Reaktor Ecosystem, Matrix42-ratkaisu, IT-johtajat' },
  { name: 'Liminal Group', industry: 'Reaktor Ecosystem / Tech', callAngle: 'Tyytyväinen asiakas, jatkaa' },
  { name: 'Aller Media', industry: 'Media', callAngle: 'Kasvanut yhteistyö 8→12→15 tap/kk' },
  { name: 'Navicre', industry: 'Logistiikka / Tech', callAngle: '60 tapaamista, halusivat tietyn SDR:n' },
  { name: 'Locoda', industry: 'Tech / SaaS', callAngle: 'Toistuva ostaja' },
  { name: 'Etlia', industry: 'B2B palvelut', callAngle: 'Toistuva ostaja, hyvät bookit' },
  { name: 'Nrep / Logicenter', industry: 'Kiinteistö / Logistiikka', callAngle: '30h tuntityö, palaava asiakas' },
  { name: 'Unit4', industry: 'ERP-ohjelmisto', callAngle: 'Kehui SDR:ää, halusivat saman tekijän jatkoon' },
  { name: 'Haamu.io', industry: 'LinkedIn ghostwriting / B2B sisältö', callAngle: '50 tapaamista, tavoite referenssitarina' },
  { name: 'Volando', industry: 'Myynti- ja markkinointikonsultointi', callAngle: '10 tap/kk, suomalaisten midcap-firmojen johto' },
  { name: 'Morgan Digital', industry: 'Markkinointi / WordPress-toimisto', callAngle: '10 tap/kk' },
  { name: 'Taimi', industry: 'AI e-learning (HR SaaS)', callAngle: 'HR & HRD-päättäjät, pilottikuukausi' },
  { name: 'Vivian White / Virpi', industry: 'Konsultointi', callAngle: 'Tyytyväinen asiakas, upsell' },
  { name: 'Webso', industry: 'Tech / Web', callAngle: '10 lisätapaamista maaliskuulle' },
  { name: 'Peanuts Group', industry: 'Ohjelmisto- & web-kehitys', callAngle: '10 tap/kk jatkuva' },
  { name: 'Coolla', industry: 'Muutosturvavalmennus / Uravalmennus', callAngle: 'HR-päättäjät, +50 hlö työllistävät firmat, lakisääteinen palvelu' },
  { name: 'Agile Work', industry: 'Toimitila- & työympäristökonsultointi', callAngle: '10 tap/kk, HubSpot-kirjaukset' },
  { name: 'Tarina Partners', industry: 'Brändi- ja tarinallistamiskonsultointi', callAngle: '10 tap/kk' },
  { name: 'ProApp', industry: 'Rakennusalan ERP', callAngle: 'PK raksafirmat 5–50 henkilöä' },
  { name: 'Growly Oy', industry: 'Shopify / Verkkokauppa', callAngle: '5 tap/kk, palaava asiakas' },
  { name: 'Oivalo', industry: 'Talouden suunnittelu- & raportointityökalut (SaaS)', callAngle: '40 tapaamista, mahdollisuus jatkuvaan' },
  { name: 'Dubs', industry: 'Logistiikkapalvelut', callAngle: '20 tap/kk jatkuva' },
  { name: 'Aceve', industry: 'Pilviohjelmistot rakennus- & talotekniikka-alalle', callAngle: 'Jatkuva, skaalautuva kohderyhmä' },
  { name: 'Splended', industry: 'IT- & dev-koulutus (in-house)', callAngle: '30h/kk, webinaariliidejä + nurturointia' },
  { name: 'Sininen Härkä', industry: 'Markkinointitoimisto', callAngle: '20 tapaamista, mahdollisuus jatkoon' },
  { name: 'Solita', industry: 'IT-konsultointi', callAngle: '20–35 tapaamista, vihjattu toisesta projektista' },
  { name: 'PBI', industry: 'Asiakaskokemus / Konsultointi', callAngle: '10–20 tap/kk' },
  { name: 'Elpartner', industry: 'Sähköverkko / Automaatio', callAngle: 'Projektiluonteinen' },
  { name: 'Pelastakaa Lapset', industry: 'Järjestö / Hyväntekeväisyys', callAngle: 'Asiakas- ja sponsorihankinta' },
  { name: 'Newsec / Niam', industry: 'Kiinteistöt / Toimistovuokraus', callAngle: 'Toimistotiloja alk. 100m², +10 hlön firmat' },
  { name: 'Raisio Oyj', industry: 'Elintarviketeollisuus', callAngle: 'Tuotantotilan alivuokraus, ylin johto rajatulta listalta' },
  { name: 'Tuloskiinteistöt (Finavia)', industry: 'Kiinteistö / Lentokenttä', callAngle: '15 F2F-tapaamista, uudet vuokralaiset HEL-Vantaalla' },
  { name: 'Mieli Ry', industry: 'Mielenterveysjärjestö', callAngle: 'Asiakas- & sponsorihankinta, FMCG-brändit' },
  { name: 'Focus Tiger', industry: 'Workplace wellbeing SaaS', callAngle: 'GTM-as-a-Service, tuli Snowfox-tapahtuman kautta' },
  { name: 'Palats.io', industry: 'Kiertotalous / SaaS (Ruotsi)', callAngle: '15 tap/kk, kunnat & kiinteistönomistajat' },
  { name: 'Lambda Factor', industry: 'IT & ohjelmistokehitys (PL/DE)', callAngle: '20 tap/kk, midcap IT-päättäjät' },
  { name: 'Villi.io', industry: 'Ecommerce growth agency', callAngle: '10 tap, DK + NL, free trial -leadmagnet' },
  { name: 'Zkond', industry: 'Performance marketing (Ruotsi)', callAngle: 'GTM, Suomi 10 tap/kk + KV ilman rajaa' },
  { name: 'Keepit', industry: 'Kyberturvallisuus / SaaS (DK)', callAngle: 'GTM-pilotti CEE + Norja' },
  { name: 'Mobal', industry: 'Paikallinen yritystieto / GTM', callAngle: 'GTM Eurooppa, 4 kaupunkia' },
  { name: 'Trellus.ai', industry: 'AI sales tools (USA)', callAngle: 'GTM globaali, ensimmäinen amerikkalainen GTM-asiakas' },
  { name: 'Billo.app', industry: 'SaaS (Liettua)', callAngle: 'GTM €2,7k/kk' },
  { name: 'Seppo.io', industry: 'Gamification / EdTech', callAngle: 'GTM kansainvälinen, min. 4kk' },
  { name: 'Syncle', industry: 'B2B SaaS', callAngle: 'GTM 6kk, Eurooppa + USA' },
  { name: 'Teamspective', industry: 'HR SaaS', callAngle: 'GTM USA + Eurooppa' },
  { name: 'Expanly', industry: 'SaaS', callAngle: 'GTM 6kk, Eurooppa + Amerikka' },
  { name: 'Luxid', industry: 'Brändi- & markkinointitoimisto', callAngle: 'GTM UK + Eurooppa, isojen firmojen markkinointijohto' },
  { name: 'Tickingbot', industry: 'Data & tiedonhallintakonsultointi', callAngle: '8–16 tap/kk, valmistava teollisuus +20M€' },
  { name: 'Redgrass.fi', industry: 'Tech', callAngle: 'Pilottiyhteistyö' },
  { name: 'EB Forum', industry: 'Tapahtumat / B2B', callAngle: '20h tuntityö' },
  { name: 'Logistic Contractor Finland', industry: 'Logistiikka', callAngle: '30h/kk' },
  { name: 'Funder Finance', industry: 'Rahoituspalvelut', callAngle: '10 tap/kk, kasvupotentiaalia' },
  { name: 'Allrounders', industry: 'B2B palvelut', callAngle: '20 lisätapaamista' },
  { name: 'Relevant Digital', industry: 'Ad tech / Publisher-alusta', callAngle: 'Clay-listat, US & UK prospektointi' },
  { name: 'Vapa Media', industry: 'Media / Sisältömarkkinointi', callAngle: '20 lisätapaamista' },
  { name: 'Viskan', industry: 'Fashion / Retail tech', callAngle: '10 lisätapaamista' },
  { name: 'Avalosys', industry: 'IT-konsultointi', callAngle: '20 tapaamista' },
]

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  let created = 0
  let skipped = 0

  for (const client of clients) {
    const result = await prisma.projectCard.upsert({
      where: { name: client.name },
      update: {},
      create: client,
    })
    if (result.callAngle === client.callAngle) {
      created++
    } else {
      skipped++
    }
  }

  // More accurate count
  const total = await prisma.projectCard.count()
  console.log(`✅ Asiakkaat tuotu. Tietokannassa nyt ${total} projektia.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
