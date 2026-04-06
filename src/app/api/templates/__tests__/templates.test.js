'use strict'

// Unit tests for template filtering and channel grouping

const VALID_CHANNELS = ['linkedin', 'email', 'sms', 'phone']

function filterByChannel(templates, channel) {
  return templates.filter((t) => t.channel === channel)
}

function groupByChannel(templates) {
  return templates.reduce((acc, t) => {
    if (!acc[t.channel]) acc[t.channel] = []
    acc[t.channel].push(t)
    return acc
  }, {})
}

function validateChannel(channel) {
  return VALID_CHANNELS.includes(channel)
}

const makeTemplate = (id, channel, title) => ({ id, channel, title, body: `Body for ${title}` })

const templates = [
  makeTemplate('t1', 'linkedin', 'LinkedIn avaus'),
  makeTemplate('t2', 'linkedin', 'LinkedIn follow-up'),
  makeTemplate('t3', 'email', 'Sähköposti kylmä'),
  makeTemplate('t4', 'email', 'Sähköposti follow-up'),
  makeTemplate('t5', 'sms', 'SMS muistutus'),
  makeTemplate('t6', 'phone', 'Puhelu avaus'),
  makeTemplate('t7', 'phone', 'Puhelu vastaväite'),
]

describe('filterByChannel', () => {
  test('returns only linkedin templates', () => {
    const result = filterByChannel(templates, 'linkedin')
    expect(result).toHaveLength(2)
    expect(result.every((t) => t.channel === 'linkedin')).toBe(true)
  })

  test('returns only email templates', () => {
    const result = filterByChannel(templates, 'email')
    expect(result).toHaveLength(2)
  })

  test('returns empty list for unknown channel', () => {
    const result = filterByChannel(templates, 'telegram')
    expect(result).toHaveLength(0)
  })
})

describe('groupByChannel', () => {
  test('groups all 4 channels', () => {
    const groups = groupByChannel(templates)
    expect(Object.keys(groups).sort()).toEqual(['email', 'linkedin', 'phone', 'sms'])
  })

  test('linkedin has 2 templates', () => {
    const groups = groupByChannel(templates)
    expect(groups.linkedin).toHaveLength(2)
  })

  test('phone has 2 templates', () => {
    const groups = groupByChannel(templates)
    expect(groups.phone).toHaveLength(2)
  })
})

describe('validateChannel', () => {
  test('accepts valid channels', () => {
    expect(validateChannel('linkedin')).toBe(true)
    expect(validateChannel('email')).toBe(true)
    expect(validateChannel('sms')).toBe(true)
    expect(validateChannel('phone')).toBe(true)
  })

  test('rejects invalid channels', () => {
    expect(validateChannel('telegram')).toBe(false)
    expect(validateChannel('twitter')).toBe(false)
    expect(validateChannel('')).toBe(false)
    expect(validateChannel(undefined)).toBe(false)
  })
})

describe('template copy content', () => {
  test('each template has non-empty body', () => {
    templates.forEach((t) => {
      expect(t.body).toBeTruthy()
      expect(t.body.trim().length).toBeGreaterThan(0)
    })
  })

  test('templates have title and channel', () => {
    templates.forEach((t) => {
      expect(t.title).toBeTruthy()
      expect(t.channel).toBeTruthy()
    })
  })
})
