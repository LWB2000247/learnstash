import { addDays } from './dates'
import { isDue } from './sm2'
import type { DayLog, Idea, IdeaProgress, TopicId } from '../types'

export function currentStreak(days: Record<string, DayLog>, today: string): number {
  const start = days[today]?.goalMet ? today : addDays(today, -1)
  let count = 0
  let cursor = start
  while (days[cursor]?.goalMet) {
    count += 1
    cursor = addDays(cursor, -1)
    if (count > 20000) break
  }
  return count
}

export function bestStreak(days: Record<string, DayLog>): number {
  const dates = Object.keys(days)
    .filter((date) => days[date]?.goalMet)
    .sort()
  let best = 0
  let run = 0
  let previous = ''
  for (const date of dates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }
  return best
}

export function totals(progress: Record<string, IdeaProgress>) {
  let read = 0
  let saved = 0
  let liked = 0
  let reviews = 0
  let remembered = 0
  for (const item of Object.values(progress)) {
    if (item.seenAt) read += 1
    if (item.saved) saved += 1
    if (item.liked) liked += 1
    reviews += item.reviewCount
    remembered += item.rememberedCount
  }
  return {
    read,
    saved,
    liked,
    reviews,
    remembered,
    retention: reviews === 0 ? null : remembered / reviews,
  }
}

export function topicCounts(ideas: Idea[], progress: Record<string, IdeaProgress>) {
  const counts = new Map<TopicId, number>()
  for (const idea of ideas) {
    if (!progress[idea.id]?.seenAt) continue
    counts.set(idea.topic, (counts.get(idea.topic) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
}

export function countDue(progress: Record<string, IdeaProgress>, today: string): number {
  return Object.values(progress).filter((item) => item.saved && item.srs && isDue(item.srs.due, today)).length
}

export function dueIdeas(ideas: Idea[], progress: Record<string, IdeaProgress>, today: string): Idea[] {
  return ideas
    .filter((idea) => {
      const item = progress[idea.id]
      return Boolean(item?.saved && item.srs && isDue(item.srs.due, today))
    })
    .sort((a, b) => {
      const left = progress[a.id]?.srs?.due ?? ''
      const right = progress[b.id]?.srs?.due ?? ''
      return left.localeCompare(right) || a.title.localeCompare(b.title, 'de')
    })
}
