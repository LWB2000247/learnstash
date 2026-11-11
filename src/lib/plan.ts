import type { AppData, Idea, IdeaProgress, TopicId } from '../types'

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const swap = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = swap
  }
  return copy
}

export function makePlan(
  ideas: Idea[],
  interests: TopicId[],
  goal: number,
  progress: Record<string, IdeaProgress>,
  date: string,
): string[] {
  const random = mulberry32(hashString(`${date}|${interests.join(',')}|${goal}`))
  const picked: Idea[] = []
  const take = (pool: Idea[]) => {
    for (const idea of shuffle(pool, random)) {
      if (picked.length >= goal) return
      if (!picked.some((item) => item.id === idea.id)) picked.push(idea)
    }
  }
  const unseen = ideas.filter((idea) => !progress[idea.id]?.seenAt)
  take(unseen.filter((idea) => interests.includes(idea.topic)))
  take(unseen.filter((idea) => !interests.includes(idea.topic)))
  take(ideas.filter((idea) => interests.includes(idea.topic)))
  take(ideas)
  return picked.slice(0, goal).map((idea) => idea.id)
}

export function orderFeed(ideas: Idea[], planIds: string[], interests: TopicId[]): Idea[] {
  const byId = new Map(ideas.map((idea) => [idea.id, idea]))
  const plan: Idea[] = []
  for (const id of planIds) {
    const idea = byId.get(id)
    if (idea) plan.push(idea)
  }
  const planned = new Set(plan.map((idea) => idea.id))
  const rest = ideas.filter((idea) => !planned.has(idea.id))
  rest.sort((a, b) => {
    const ai = interests.includes(a.topic) ? 0 : 1
    const bi = interests.includes(b.topic) ? 0 : 1
    if (ai !== bi) return ai - bi
    return a.title.localeCompare(b.title, 'de')
  })
  return [...plan, ...rest]
}

export function withPlan(data: AppData, ideas: Idea[], today: string): AppData {
  if (!data.profile) return { ...data, planDate: null, planIds: [] }
  return {
    ...data,
    planDate: today,
    planIds: makePlan(ideas, data.profile.interests, data.profile.dailyGoal, data.progress, today),
  }
}
