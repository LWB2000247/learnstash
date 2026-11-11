import { addDays } from './dates'
import type { Rating, SrsState } from '../types'

/**
 * SM-2-style scheduler.
 *
 * Ease follows the SuperMemo SM-2 formula:
 * ease + (0.1 - (5-q) * (0.08 + (5-q) * 0.02)), never below 1.3.
 * Quality: again = 1, hard = 3, good = 4, easy = 5.
 *
 * Intervals are shaped by the rating so the four buttons schedule
 * different gaps (classic SM-2 uses the same ladder for every pass):
 * - again: 1 day, repetitions reset, lapse + 1
 * - hard:  2 days the first time, otherwise max(interval + 1, round(interval * 1.2))
 * - good:  3 days, then 6, then round(interval * ease)
 * - easy:  7 days the first time, then round(interval * the updated ease * 1.3)
 */

const QUALITY: Record<Rating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

export const DEFAULT_EASE = 2.5

export function nextEase(ease: number, rating: Rating): number {
  const q = QUALITY[rating]
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  return Math.max(1.3, Math.round((ease + delta) * 1000) / 1000)
}

export function freshSrs(today: string): SrsState {
  return {
    ease: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    due: today,
    lapses: 0,
  }
}

export function schedule(card: SrsState, rating: Rating, today: string): SrsState {
  const ease = nextEase(card.ease, rating)
  if (rating === 'again') {
    return {
      ease,
      interval: 1,
      repetitions: 0,
      due: addDays(today, 1),
      lapses: card.lapses + 1,
    }
  }

  const repetitions = card.repetitions + 1
  let interval: number
  if (rating === 'hard') {
    interval = card.repetitions === 0 ? 2 : Math.max(card.interval + 1, Math.round(card.interval * 1.2))
  } else if (rating === 'good') {
    if (card.repetitions === 0) interval = 3
    else if (card.repetitions === 1) interval = 6
    else interval = Math.max(card.interval + 1, Math.round(card.interval * ease))
  } else if (card.repetitions === 0) {
    interval = 7
  } else {
    interval = Math.max(card.interval + 1, Math.round(card.interval * ease * 1.3))
  }

  return {
    ease,
    interval,
    repetitions,
    due: addDays(today, interval),
    lapses: card.lapses,
  }
}

export function isDue(due: string, today: string): boolean {
  return due <= today
}
