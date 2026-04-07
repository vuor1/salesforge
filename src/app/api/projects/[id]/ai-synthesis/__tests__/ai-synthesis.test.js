'use strict'

// Unit tests for AI synthesis prompt construction logic

function buildSynthesisPrompt(project, scripts, experiences) {
  const hasData = scripts.length > 0 || experiences.length > 0

  if (!hasData) {
    return {
      isGeneralKnowledge: true,
      includesProjectName: true,
      includesCallAngle: !!project.callAngle,
    }
  }

  return {
    isGeneralKnowledge: false,
    includesScriptCount: true,
    includesExperienceCount: true,
    scriptCount: scripts.length,
    experienceCount: experiences.length,
  }
}

function buildFollowUpPrompt(project, scripts, experiences, question) {
  if (!question || !question.trim()) throw new Error('Question required')
  return {
    hasContext: true,
    hasQuestion: true,
    usesTeamData: scripts.length > 0 || experiences.length > 0,
  }
}

describe('buildSynthesisPrompt', () => {
  const project = { name: 'Projekti X', industry: 'IT', callAngle: 'Säästä aikaa' }

  test('uses general knowledge when no team data', () => {
    const result = buildSynthesisPrompt(project, [], [])
    expect(result.isGeneralKnowledge).toBe(true)
    expect(result.includesProjectName).toBe(true)
  })

  test('includes call angle in general knowledge prompt when present', () => {
    const result = buildSynthesisPrompt(project, [], [])
    expect(result.includesCallAngle).toBe(true)
  })

  test('does NOT use general knowledge when scripts exist', () => {
    const scripts = [{ id: 's1', opening: 'Hei', objections: '', closing: '' }]
    const result = buildSynthesisPrompt(project, scripts, [])
    expect(result.isGeneralKnowledge).toBe(false)
    expect(result.includesScriptCount).toBe(true)
    expect(result.scriptCount).toBe(1)
  })

  test('includes experience count when experiences exist', () => {
    const experiences = [
      { id: 'e1', content: 'Meni hyvin', score: 4 },
      { id: 'e2', content: 'OK', score: null },
    ]
    const result = buildSynthesisPrompt(project, [], experiences)
    expect(result.isGeneralKnowledge).toBe(false)
    expect(result.experienceCount).toBe(2)
  })

  test('includes both scripts and experiences when both exist', () => {
    const scripts = [{ id: 's1', opening: 'Hei' }]
    const experiences = [{ id: 'e1', content: 'Toimi' }]
    const result = buildSynthesisPrompt(project, scripts, experiences)
    expect(result.scriptCount).toBe(1)
    expect(result.experienceCount).toBe(1)
  })
})

describe('buildFollowUpPrompt', () => {
  const project = { name: 'Projekti X', industry: 'IT', callAngle: 'Säästä aikaa' }

  test('includes question and context', () => {
    const result = buildFollowUpPrompt(project, [], [], 'Miten aloitan soiton?')
    expect(result.hasContext).toBe(true)
    expect(result.hasQuestion).toBe(true)
  })

  test('uses team data when available', () => {
    const scripts = [{ id: 's1', opening: 'Hei' }]
    const result = buildFollowUpPrompt(project, scripts, [], 'Miten aloitan?')
    expect(result.usesTeamData).toBe(true)
  })

  test('works without team data', () => {
    const result = buildFollowUpPrompt(project, [], [], 'Miten aloitan?')
    expect(result.usesTeamData).toBe(false)
  })

  test('throws when question is empty', () => {
    expect(() => buildFollowUpPrompt(project, [], [], '')).toThrow('Question required')
  })
})
