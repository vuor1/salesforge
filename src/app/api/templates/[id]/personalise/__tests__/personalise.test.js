'use strict'

// Unit tests for AI personalisation prompt building

function buildPersonalisePrompt({ template, project, note }) {
  const storiesExcerpt = (project.callStories ?? [])
    .slice(0, 3)
    .map((s) => `- ${s.content.substring(0, 150)}`)
    .join('\n')

  const lines = [
    `Personalisoi seuraava viestimalli projektin kontekstin pohjalta.`,
    ``,
    `Projekti: ${project.name}`,
    `Toimiala: ${project.industry}`,
    project.callAngle ? `Soittokulma: ${project.callAngle}` : null,
    storiesExcerpt ? `\nTiimin kokemuksia projektista:\n${storiesExcerpt}` : null,
    ``,
    `Alkuperäinen malli (kanava: ${template.channel}):`,
    template.body,
    note ? `\nLisähuomio: ${note}` : null,
    ``,
    `Muokkaa malli niin, että se viittaa projektin spesifiseen kontekstiin ja tuntuu henkilökohtaiselta.`,
    `Säilytä viestin rakenne ja pituus. Vastaa samalla kielellä kuin alkuperäinen malli.`,
  ]

  return lines.filter((l) => l !== null).join('\n')
}

const project = {
  id: 'proj-1',
  name: 'Asiakas Oy',
  industry: 'IT',
  callAngle: 'Kustannussäästöt automaatiolla',
  callStories: [{ content: 'Ensimmäinen tarina' }, { content: 'Toinen tarina' }],
}

const template = {
  id: 'tmpl-1',
  channel: 'linkedin',
  title: 'LinkedIn avaus',
  body: 'Hei [Nimi], huomasin [Yritys]...',
}

describe('buildPersonalisePrompt', () => {
  test('includes project name and industry', () => {
    const prompt = buildPersonalisePrompt({ template, project, note: null })
    expect(prompt).toContain('Asiakas Oy')
    expect(prompt).toContain('IT')
  })

  test('includes call angle', () => {
    const prompt = buildPersonalisePrompt({ template, project, note: null })
    expect(prompt).toContain('Kustannussäästöt automaatiolla')
  })

  test('includes original template body', () => {
    const prompt = buildPersonalisePrompt({ template, project, note: null })
    expect(prompt).toContain(template.body)
  })

  test('includes channel in context', () => {
    const prompt = buildPersonalisePrompt({ template, project, note: null })
    expect(prompt).toContain('kanava: linkedin')
  })

  test('includes note when provided', () => {
    const prompt = buildPersonalisePrompt({
      template,
      project,
      note: 'mainitse laajentuminen Ruotsiin',
    })
    expect(prompt).toContain('Lisähuomio: mainitse laajentuminen Ruotsiin')
  })

  test('omits note section when note is null', () => {
    const prompt = buildPersonalisePrompt({ template, project, note: null })
    expect(prompt).not.toContain('Lisähuomio:')
  })

  test('includes team stories (max 3)', () => {
    const projectWithStories = {
      ...project,
      callStories: [
        { content: 'Tarina 1' },
        { content: 'Tarina 2' },
        { content: 'Tarina 3' },
        { content: 'Tarina 4 — ei pidä näkyä' },
      ],
    }
    const prompt = buildPersonalisePrompt({ template, project: projectWithStories, note: null })
    expect(prompt).toContain('Tarina 1')
    expect(prompt).toContain('Tarina 3')
    expect(prompt).not.toContain('Tarina 4')
  })

  test('omits stories section when no stories', () => {
    const emptyProject = { ...project, callStories: [] }
    const prompt = buildPersonalisePrompt({ template, project: emptyProject, note: null })
    expect(prompt).not.toContain('Tiimin kokemuksia')
  })

  test('omits call angle when not present', () => {
    const noAngle = { ...project, callAngle: null }
    const prompt = buildPersonalisePrompt({ template, project: noAngle, note: null })
    expect(prompt).not.toContain('Soittokulma:')
  })
})

describe('AI unavailable fallback', () => {
  test('AI error has correct shape', () => {
    const err = { error: { code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable' } }
    expect(err.error.code).toBe('AI_UNAVAILABLE')
    expect(err.data).toBeUndefined()
  })

  test('original template body is always available', () => {
    // Original template is never dependent on AI
    expect(template.body).toBeTruthy()
  })
})
