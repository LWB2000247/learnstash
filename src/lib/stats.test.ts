import { describe, expect, it } from 'vitest'
import { blankProgress } from './model'
import { bestStreak, currentStreak, totals } from './stats'
import type { DayLog } from '../types'

function day(goalMet: boolean): DayLog {
  return { seen: goalMet ? ['a'] : [], reviews: 0, remembered: 0, goalMet }
}

describe('streaks', () => {
  it('counts today when the goal is met and protects yesterday otherwise', () => {
    const days = {
      '2026-11-09': day(true),
      '2026-11-10': day(true),
      '2026-11-11': day(false),
    }
    expect(currentStreak(days, '2026-11-11')).toBe(2)
    expect(currentStreak({ ...days, '2026-11-11': day(true) }, '2026-11-11')).toBe(3)
  })

  it('breaks the streak when a day is missing', () => {
    const days = {
      '2026-11-08': day(true),
      '2026-11-10': day(true),
    }
    expect(currentStreak(days, '2026-11-11')).toBe(1)
    expect(bestStreak(days)).toBe(1)
    expect(bestStreak({ ...days, '2026-11-09': day(true) })).toBe(3)
  })

  it('returns zero before the first successful day', () => {
    expect(currentStreak({}, '2026-11-11')).toBe(0)
    expect(bestStreak({})).toBe(0)
  })
})

describe('totals', () => {
  it('computes retention from Good and Easy ratings only', () => {
    const read = { ...blankProgress(), seenAt: '2026-11-11T10:00:00.000Z' }
    const saved = {
      ...blankProgress(),
      saved: true,
      seenAt: '2026-11-11T10:00:00.000Z',
      reviewCount: 4,
      rememberedCount: 3,
    }
    const result = totals({ a: read, b: saved })
    expect(result.read).toBe(2)
    expect(result.saved).toBe(1)
    expect(result.reviews).toBe(4)
    expect(result.retention).toBeCloseTo(0.75)
  })

  it('returns null retention before the first review', () => {
    expect(totals({}).retention).toBeNull()
  })
})
