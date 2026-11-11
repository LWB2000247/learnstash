import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { freshSrs, nextEase, schedule } from './sm2'

const today = '2026-11-11'

describe('SM-2 ease', () => {
  it('moves ease by the classic quality formula', () => {
    expect(nextEase(2.5, 'again')).toBeCloseTo(1.96, 2)
    expect(nextEase(2.5, 'hard')).toBeCloseTo(2.36, 2)
    expect(nextEase(2.5, 'good')).toBeCloseTo(2.5, 2)
    expect(nextEase(2.5, 'easy')).toBeCloseTo(2.6, 2)
  })

  it('never drops ease below 1.3', () => {
    let ease = 1.3
    for (let i = 0; i < 8; i++) ease = nextEase(ease, 'again')
    expect(ease).toBe(1.3)
  })
})

describe('schedule', () => {
  it('does not mutate the previous card', () => {
    const card = freshSrs(today)
    const snapshot = { ...card }
    schedule(card, 'good', today)
    expect(card).toEqual(snapshot)
  })

  it('gives a fresh card different gaps for each rating', () => {
    const card = freshSrs(today)
    expect(schedule(card, 'again', today).interval).toBe(1)
    expect(schedule(card, 'hard', today).interval).toBe(2)
    expect(schedule(card, 'good', today).interval).toBe(3)
    expect(schedule(card, 'easy', today).interval).toBe(7)
    const gaps = (['again', 'hard', 'good', 'easy'] as const).map((rating) => schedule(card, rating, today).interval)
    expect(gaps[0]).toBeLessThanOrEqual(gaps[1] ?? 0)
    expect(gaps[1]).toBeLessThanOrEqual(gaps[2] ?? 0)
    expect(gaps[2]).toBeLessThanOrEqual(gaps[3] ?? 0)
  })

  it('resets repetitions after a lapse and grows them after a pass', () => {
    const failed = schedule(freshSrs(today), 'again', today)
    expect(failed).toMatchObject({ repetitions: 0, interval: 1, lapses: 1, due: '2026-11-12' })
    const passed = schedule(freshSrs(today), 'good', today)
    expect(passed).toMatchObject({ repetitions: 1, interval: 3, lapses: 0, due: '2026-11-14' })
  })

  it('follows 3 days, then 6, then ease times interval for Good', () => {
    const first = schedule(freshSrs(today), 'good', today)
    const second = schedule(first, 'good', first.due)
    const third = schedule(second, 'good', second.due)
    expect(first.interval).toBe(3)
    expect(second.interval).toBe(6)
    expect(third.interval).toBe(Math.round(6 * second.ease))
    expect(third.repetitions).toBe(3)
    expect(third.due).toBe(addDays(second.due, third.interval))
  })

  it('keeps Hard shorter than the Good ladder', () => {
    const learned = schedule(schedule(freshSrs(today), 'good', today), 'good', '2026-11-14')
    const hard = schedule(learned, 'hard', learned.due)
    expect(hard.interval).toBe(Math.max(learned.interval + 1, Math.round(learned.interval * 1.2)))
    expect(hard.repetitions).toBe(learned.repetitions + 1)
    expect(hard.lapses).toBe(0)
  })

  it('lengthens Easy reviews and raises ease', () => {
    const easy = schedule(freshSrs(today), 'easy', today)
    expect(easy.ease).toBeGreaterThan(2.5)
    expect(easy.interval).toBe(7)
    const next = schedule(easy, 'easy', easy.due)
    expect(next.ease).toBeGreaterThan(easy.ease)
    expect(next.interval).toBe(Math.max(easy.interval + 1, Math.round(easy.interval * next.ease * 1.3)))
  })

  it('starts the Good ladder over after Again', () => {
    const learned = schedule(freshSrs(today), 'good', today)
    const lapsed = schedule(learned, 'again', learned.due)
    const restart = schedule(lapsed, 'good', lapsed.due)
    expect(lapsed.repetitions).toBe(0)
    expect(restart.interval).toBe(3)
    expect(restart.repetitions).toBe(1)
  })

  it('makes a saved card due today and steps across month and leap-day boundaries', () => {
    expect(freshSrs('2026-01-31').due).toBe('2026-01-31')
    expect(schedule(freshSrs('2026-01-31'), 'good', '2026-01-31').due).toBe('2026-02-03')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})
