import { requireAuth } from '@/lib/api-auth'
import { getAIResponse } from '@/lib/ai'

const VALID_THEMES = ['growth_club', 'own_experience', 'sales_tip', 'mindset']

const THEME_PROMPTS = {
  growth_club: `Olet apulainen, joka auttaa myyjää kirjoittamaan LinkedIn-postauksen Growth Club -session oppien pohjalta.

Kirjoita julkaisukelpoinen LinkedIn-postaus suomeksi ensimmäisessä persoonassa. Rakenne:
- Vahva hook-lause joka herättää kiinnostuksen
- 2–3 kappaletta opin sisällöstä konkreettisesti
- Lopussa kysymys tai CTA joka kutsuu kommentoimaan

Tyyli: aito, ammatillinen mutta persoonallinen. Max 200 sanaa. Älä lisää hashtageja.`,

  own_experience: `Olet apulainen, joka auttaa myyjää kirjoittamaan LinkedIn-postauksen oman kokemuksen pohjalta.

Kirjoita julkaisukelpoinen LinkedIn-postaus suomeksi ensimmäisessä persoonassa. Rakenne:
- Tarttuvaa hook joka alkaa tilanteesta tai tunteesta
- Kerro kokemus ja mitä opit siitä
- Lopussa kysymys tai oivallus lukijalle

Tyyli: rehellinen, haavoittuvainen mutta eteenpäin katsova. Max 200 sanaa. Älä lisää hashtageja.`,

  sales_tip: `Olet apulainen, joka auttaa myyjää kirjoittamaan LinkedIn-postauksen myyntivinkin muodossa.

Kirjoita julkaisukelpoinen LinkedIn-postaus suomeksi ensimmäisessä persoonassa. Rakenne:
- Hook: "Yksi asia joka muutti tapani tehdä X"
- Konkreettinen vinkki selitettynä käytännönläheisesti
- Miksi se toimii / mitä tapahtui kun kokeilit

Tyyli: asiantunteva mutta helposti lähestyttävä. Max 200 sanaa. Älä lisää hashtageja.`,

  mindset: `Olet apulainen, joka auttaa myyjää kirjoittamaan LinkedIn-postauksen mindset-aiheesta.

Kirjoita julkaisukelpoinen LinkedIn-postaus suomeksi ensimmäisessä persoonassa. Rakenne:
- Hook: ajatusta herättävä väite tai kysymys
- Oma näkökulma aiheeseen 2–3 kappaleessa
- Lopetus: haaste tai kutsu reflektointiin

Tyyli: filosofinen mutta käytännönläheinen, innostava. Max 200 sanaa. Älä lisää hashtageja.`,
}

export async function POST(request) {
  const { response } = await requireAuth()
  if (response) return response

  const { theme, context } = await request.json()

  if (!VALID_THEMES.includes(theme)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: `theme tulee olla: ${VALID_THEMES.join(', ')}` } },
      { status: 400 }
    )
  }

  if (!context?.trim()) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Konteksti on pakollinen' } },
      { status: 400 }
    )
  }

  const result = await getAIResponse({
    systemPrompt: THEME_PROMPTS[theme],
    userMessage: context.trim(),
  })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 503 })
  }

  return Response.json({ data: { post: result.data } })
}
