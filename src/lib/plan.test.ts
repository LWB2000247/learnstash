import { describe, expect, it } from 'vitest'
import { makePlan, orderFeed } from './plan'
import type { Idea, TopicId } from '../types'

function idea(id: string, topic: TopicId): Idea {
  return { id, title: id, text: 'Ein Satz. Noch einer.', source: 'Quelle', author: 'Jemand', topic }
}

const ideas = [
  idea('a', 'psychologie'),
  idea('b', 'psychologie'),
  idea('c', 'geld'),
  idea('d', 'lernen'),
  idea('e', 'philosophie'),
  idea('f', 'gesundheit'),
]

describe('makePlan', () => {
  it('is stable for the same day and changes with the date', () => {
    const first = makePlan(ideas, ['psychologie', 'geld'], 3, {}, '2026-11-11')
    const second = makePlan(ideas, ['psychologie', 'geld'], 3, {}, '2026-11-11')
    expect(second).toEqual(first)
    expect(first).toHaveLength(3)
    const otherDays = ['2026-11-12', '2026-11-13', '2026-12-01', '2027-01-02'].map((date) =>
      makePlan(ideas, ['psychologie', 'geld'], 3, {}, date).join(','),
    )
    expect(new Set([first.join(','), ...otherDays]).size).toBeGreaterThan(1)
  })

  it('prefers unseen ideas in the chosen interests', () => {
    const seen = {
      saved: false,
      collectionId: null,
      liked: false,
      seenAt: '2026-11-01T00:00:00.000Z',
      srs: null,
      reviewCount: 0,
      rememberedCount: 0,
    }
    const plan = makePlan(ideas, ['psychologie'], 2, { a: seen }, '2026-11-11')
    expect(plan[0]).toBe('b')
    expect(plan).not.toContain('a')
  })

  it('fills from other topics when interests are exhausted', () => {
    const plan = makePlan(ideas, ['lernen'], 3, {}, '2026-11-11')
    expect(plan[0]).toBe('d')
    expect(plan).toHaveLength(3)
    expect(new Set(plan).size).toBe(3)
  })
})

describe('orderFeed', () => {
  it('keeps the daily plan in front without reshuffling it', () => {
    const ordered = orderFeed(ideas, ['f', 'c'], ['psychologie'])
    expect(ordered.map((item) => item.id).slice(0, 2)).toEqual(['f', 'c'])
    expect(ordered.map((item) => item.id)).toContain('a')
    expect(ordered.findIndex((item) => item.id === 'a')).toBeLessThan(ordered.findIndex((item) => item.id === 'd'))
  })
})
