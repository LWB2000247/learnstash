import { describe, expect, it } from 'vitest'
import { parseBackup, serializeBackup } from './backup'
import { emptyData } from './model'

describe('backup', () => {
  it('round-trips profile, custom ideas and progress', () => {
    const data = emptyData()
    data.profile = {
      name: 'Leon',
      goals: ['behalten'],
      interests: ['lernen'],
      dailyGoal: 10,
      createdAt: '2026-11-11T00:00:00.000Z',
    }
    data.customIdeas = [
      {
        id: 'c-1',
        title: 'Eigene Notiz',
        text: 'Ein Gedanke. Noch ein Satz.',
        source: 'Notiz',
        author: 'Leon',
        topic: 'lernen',
        custom: true,
      },
    ]
    data.collections = [{ id: 'stash', name: 'Mein Stash', createdAt: '2026-11-11T00:00:00.000Z' }]
    data.progress['c-1'] = {
      saved: true,
      collectionId: 'stash',
      liked: false,
      seenAt: null,
      srs: { ease: 2.5, interval: 0, repetitions: 0, due: '2026-11-11', lapses: 0 },
      reviewCount: 0,
      rememberedCount: 0,
    }
    const parsed = parseBackup(serializeBackup(data))
    expect(parsed?.profile?.name).toBe('Leon')
    expect(parsed?.customIdeas).toHaveLength(1)
    expect(parsed?.progress['c-1']?.saved).toBe(true)
  })

  it('rejects garbage, the wrong version and a broken idea', () => {
    expect(parseBackup('nope')).toBeNull()
    expect(parseBackup('{}')).toBeNull()
    expect(parseBackup(JSON.stringify({ version: 2 }))).toBeNull()
    const broken = emptyData()
    const text = serializeBackup(broken).replace('"customIdeas": []', '"customIdeas": [{"id":"x"}]')
    expect(parseBackup(text)).toBeNull()
  })

  it('drops a malformed progress entry and keeps a valid one', () => {
    const data = emptyData()
    const raw = JSON.parse(serializeBackup(data)) as { progress: Record<string, unknown> }
    raw.progress = { ok: { saved: true, reviewCount: 2 }, bad: 'nope' }
    const parsed = parseBackup(JSON.stringify(raw))
    expect(parsed?.progress.ok?.saved).toBe(true)
    expect(parsed?.progress.ok?.reviewCount).toBe(2)
    expect(parsed?.progress.bad).toBeUndefined()
  })
})
