import type { AppData, IdeaProgress } from '../types'

export function blankProgress(): IdeaProgress {
  return {
    saved: false,
    collectionId: null,
    liked: false,
    seenAt: null,
    srs: null,
    reviewCount: 0,
    rememberedCount: 0,
  }
}

export function emptyData(): AppData {
  return {
    version: 1,
    profile: null,
    customIdeas: [],
    collections: [],
    progress: {},
    days: {},
    lastCollectionId: null,
    theme: 'system',
    planDate: null,
    planIds: [],
  }
}

export function emptyDay() {
  return { seen: [] as string[], reviews: 0, remembered: 0, goalMet: false }
}
