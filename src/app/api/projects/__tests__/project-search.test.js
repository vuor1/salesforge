'use strict'

// Test project search/filter logic directly

const projects = [
  { id: '1', name: 'Nets', industry: 'Maksupalvelut / Fintech', callAngle: 'Iso volyymi', storyCount: 3 },
  { id: '2', name: 'Terveystalo', industry: 'Työterveyspalvelut', callAngle: 'Suurasiakassegmentti', storyCount: 0 },
  { id: '3', name: 'Visma Netvisor', industry: 'Taloushallinto-ohjelmisto', callAngle: 'Palaava asiakas', storyCount: 5 },
  { id: '4', name: 'Solita', industry: 'IT-konsultointi', callAngle: '20–35 tapaamista', storyCount: 1 },
  { id: '5', name: 'Keepit', industry: 'Kyberturvallisuus / SaaS (DK)', callAngle: 'GTM-pilotti', storyCount: 0 },
]

function filterProjects(projects, search) {
  if (!search || search.trim() === '') return projects
  const q = search.trim().toLowerCase()
  return projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.industry.toLowerCase().includes(q)
  )
}

describe('project search filter', () => {
  test('empty search returns all projects', () => {
    expect(filterProjects(projects, '').length).toBe(5)
    expect(filterProjects(projects, null).length).toBe(5)
    expect(filterProjects(projects, undefined).length).toBe(5)
  })

  test('matches by name (case-insensitive)', () => {
    expect(filterProjects(projects, 'nets').length).toBe(1)
    expect(filterProjects(projects, 'NETS').length).toBe(1)
    expect(filterProjects(projects, 'Nets')[0].name).toBe('Nets')
  })

  test('matches by industry (case-insensitive)', () => {
    const results = filterProjects(projects, 'kyberturvallisuus')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Keepit')
  })

  test('matches partial name', () => {
    const results = filterProjects(projects, 'visma')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Visma Netvisor')
  })

  test('matches partial industry', () => {
    const results = filterProjects(projects, 'konsultointi')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Solita')
  })

  test('returns empty array when no matches', () => {
    expect(filterProjects(projects, 'xxxxxxxx').length).toBe(0)
  })

  test('whitespace-only search returns all projects', () => {
    expect(filterProjects(projects, '   ').length).toBe(5)
  })

  test('result includes storyCount', () => {
    const results = filterProjects(projects, 'visma')
    expect(results[0].storyCount).toBe(5)
  })

  test('multi-word search matches name containing both words', () => {
    // "visma" matches Visma Netvisor
    const results = filterProjects(projects, 'visma net')
    // "visma net" as substring matches "visma netvisor"
    expect(results.length).toBe(1)
  })

  test('industry search finds IT-konsultointi projects', () => {
    const results = filterProjects(projects, 'IT-konsultointi')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Solita')
  })
})
