import { blankProgress, emptyData } from './model'
import { isDailyGoal, isGoal, isTopic, type AppData, type Idea, type IdeaProgress, type SrsState } from '../types'

export const STORAGE_KEY = 'learnstash-v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isIdea(value: unknown): value is Idea {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.title === 'string' &&
    typeof value.text === 'string' &&
    typeof value.source === 'string' &&
    typeof value.author === 'string' &&
    typeof value.topic === 'string' &&
    isTopic(value.topic)
  )
}

function isSrs(value: unknown): value is SrsState {
  if (!isRecord(value)) return false
  return (
    typeof value.ease === 'number' &&
    typeof value.interval === 'number' &&
    typeof value.repetitions === 'number' &&
    typeof value.due === 'string' &&
    typeof value.lapses === 'number'
  )
}

function sanitizeProgress(value: unknown): Record<string, IdeaProgress> {
  if (!isRecord(value)) return {}
  const progress: Record<string, IdeaProgress> = {}
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue
    const base = blankProgress()
    progress[id] = {
      ...base,
      saved: entry.saved === true,
      collectionId: typeof entry.collectionId === 'string' ? entry.collectionId : null,
      liked: entry.liked === true,
      seenAt: typeof entry.seenAt === 'string' ? entry.seenAt : null,
      srs: isSrs(entry.srs) ? entry.srs : null,
      reviewCount: num(entry.reviewCount),
      rememberedCount: num(entry.rememberedCount),
    }
  }
  return progress
}

export function parseBackup(text: string): AppData | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (!isRecord(raw) || raw.version !== 1) return null
  if (raw.profile != null) {
    if (!isRecord(raw.profile)) return null
    const profile = raw.profile
    if (typeof profile.name !== 'string') return null
    if (!Array.isArray(profile.goals) || !profile.goals.every((goal) => typeof goal === 'string' && isGoal(goal))) {
      return null
    }
    if (
      !Array.isArray(profile.interests) ||
      !profile.interests.every((topic) => typeof topic === 'string' && isTopic(topic))
    ) {
      return null
    }
    if (typeof profile.dailyGoal !== 'number' || !isDailyGoal(profile.dailyGoal)) return null
    if (typeof profile.createdAt !== 'string') return null
  }
  if (!Array.isArray(raw.customIdeas) || !raw.customIdeas.every(isIdea)) return null
  if (!Array.isArray(raw.collections)) return null
  for (const collection of raw.collections) {
    if (!isRecord(collection)) return null
    if (typeof collection.id !== 'string' || typeof collection.name !== 'string' || typeof collection.createdAt !== 'string') {
      return null
    }
  }
  if (!isRecord(raw.days)) return null
  const days: AppData['days'] = {}
  for (const [date, entry] of Object.entries(raw.days)) {
    if (!isRecord(entry) || !Array.isArray(entry.seen)) continue
    days[date] = {
      seen: entry.seen.filter((id): id is string => typeof id === 'string'),
      reviews: num(entry.reviews),
      remembered: num(entry.remembered),
      goalMet: entry.goalMet === true,
    }
  }
  const theme = raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system' ? raw.theme : 'system'
  const base = emptyData()
  return {
    ...base,
    profile: (raw.profile as AppData['profile']) ?? null,
    customIdeas: raw.customIdeas as Idea[],
    collections: raw.collections as AppData['collections'],
    progress: sanitizeProgress(raw.progress),
    days,
    lastCollectionId: typeof raw.lastCollectionId === 'string' ? raw.lastCollectionId : null,
    theme,
    planDate: typeof raw.planDate === 'string' ? raw.planDate : null,
    planIds: Array.isArray(raw.planIds) ? raw.planIds.filter((id): id is string => typeof id === 'string') : [],
  }
}

export function serializeBackup(data: AppData): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)
}
