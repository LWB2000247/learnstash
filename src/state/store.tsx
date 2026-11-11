import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { parseBackup, serializeBackup, STORAGE_KEY } from '../lib/backup'
import { todayISO } from '../lib/dates'
import { seedIdeas } from '../lib/ideas'
import { blankProgress, emptyData, emptyDay } from '../lib/model'
import { withPlan } from '../lib/plan'
import { freshSrs, schedule } from '../lib/sm2'
import type { AppData, DailyGoal, GoalId, Idea, Profile, Rating, ThemeChoice, TopicId } from '../types'

interface ToastState {
  text: string
  actionLabel?: string
  onAction?: () => void
}

interface StoreActions {
  completeOnboarding: (input: { name: string; goals: GoalId[]; interests: TopicId[]; dailyGoal: DailyGoal; planIds: string[] }) => void
  updateProfile: (patch: Partial<Pick<Profile, 'name' | 'goals' | 'interests' | 'dailyGoal'>>) => void
  setTheme: (theme: ThemeChoice) => void
  markSeen: (id: string) => void
  toggleLike: (id: string) => void
  saveIdea: (id: string, collectionId?: string) => void
  unsave: (id: string) => void
  createCollection: (name: string) => string | null
  renameCollection: (id: string, name: string) => void
  deleteCollection: (id: string) => void
  createIdea: (input: { title: string; text: string; source: string; author: string; topic: TopicId }) => string
  deleteIdea: (id: string) => void
  rate: (id: string, rating: Rating) => void
  importData: (data: AppData) => void
  resetProfile: () => void
  wipe: () => void
  rebuildPlan: () => void
  notify: (text: string, action?: { label: string; run: () => void }) => void
  dismissToast: () => void
}

interface StoreValue {
  data: AppData
  ideas: Idea[]
  toast: ToastState | null
  actions: StoreActions
}

const StoreContext = createContext<StoreValue | null>(null)

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    return parseBackup(raw) ?? emptyData()
  } catch {
    return emptyData()
  }
}

function catalog(data: AppData): Idea[] {
  return [...seedIdeas, ...data.customIdeas]
}

function applyTheme(theme: ThemeChoice) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.toggleAttribute('data-theme', dark)
  if (dark) document.documentElement.dataset.theme = 'dark'
  else delete document.documentElement.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#10141a' : '#e8edf2')
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load())
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    applyTheme(data.theme)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(data.theme)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [data.theme])

  useEffect(() => {
    const syncPlan = () => {
      setData((current) => {
        if (!current.profile) return current
        if (current.planDate === todayISO()) return current
        return withPlan(current, catalog(current), todayISO())
      })
    }
    syncPlan()
    document.addEventListener('visibilitychange', syncPlan)
    return () => document.removeEventListener('visibilitychange', syncPlan)
  }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      const parsed = parseBackup(event.newValue)
      if (parsed) setData(parsed)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const actions = useMemo<StoreActions>(() => {
    const notify = (text: string, action?: { label: string; run: () => void }) => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      setToast({ text, actionLabel: action?.label, onAction: action?.run })
      toastTimer.current = window.setTimeout(() => setToast(null), 3200)
    }
    return {
      notify,
      dismissToast: () => setToast(null),
      completeOnboarding: (input) => {
        setData((current) => {
          const profile: Profile = {
            name: input.name.trim() || 'Leon',
            goals: input.goals,
            interests: input.interests,
            dailyGoal: input.dailyGoal,
            createdAt: new Date().toISOString(),
          }
          const collections = current.collections.length
            ? current.collections
            : [{ id: 'stash', name: 'Mein Stash', createdAt: new Date().toISOString() }]
          return {
            ...current,
            profile,
            collections,
            planDate: todayISO(),
            planIds: input.planIds,
          }
        })
      },
      updateProfile: (patch) => {
        setData((current) => {
          if (!current.profile) return current
          const profile = { ...current.profile, ...patch, name: (patch.name ?? current.profile.name).trim() || 'Leon' }
          const next = { ...current, profile }
          if (patch.interests || patch.dailyGoal) return withPlan(next, catalog(next), todayISO())
          return next
        })
      },
      setTheme: (theme) => setData((current) => ({ ...current, theme })),
      markSeen: (id) => {
        setData((current) => {
          if (!current.profile) return current
          const today = todayISO()
          const prev = current.progress[id] ?? blankProgress()
          const log = current.days[today] ?? emptyDay()
          const seen = log.seen.includes(id) ? log.seen : [...log.seen, id]
          return {
            ...current,
            progress: {
              ...current.progress,
              [id]: { ...prev, seenAt: prev.seenAt ?? new Date().toISOString() },
            },
            days: {
              ...current.days,
              [today]: { ...log, seen, goalMet: log.goalMet || seen.length >= current.profile.dailyGoal },
            },
          }
        })
      },
      toggleLike: (id) => {
        setData((current) => {
          const prev = current.progress[id] ?? blankProgress()
          return { ...current, progress: { ...current.progress, [id]: { ...prev, liked: !prev.liked } } }
        })
      },
      saveIdea: (id, collectionId) => {
        setData((current) => {
          const collections = current.collections.length
            ? current.collections
            : [{ id: 'stash', name: 'Mein Stash', createdAt: new Date().toISOString() }]
          const target =
            collections.find((item) => item.id === collectionId)?.id ??
            collections.find((item) => item.id === current.lastCollectionId)?.id ??
            collections[0]?.id
          if (!target) return current
          const prev = current.progress[id] ?? blankProgress()
          return {
            ...current,
            collections,
            lastCollectionId: target,
            progress: {
              ...current.progress,
              [id]: {
                ...prev,
                saved: true,
                collectionId: target,
                srs: prev.srs ?? freshSrs(todayISO()),
              },
            },
          }
        })
      },
      unsave: (id) => {
        setData((current) => {
          const prev = current.progress[id]
          if (!prev) return current
          return {
            ...current,
            progress: { ...current.progress, [id]: { ...prev, saved: false, collectionId: null } },
          }
        })
      },
      createCollection: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return null
        const id = `col-${crypto.randomUUID()}`
        setData((current) => ({
          ...current,
          collections: [...current.collections, { id, name: trimmed.slice(0, 40), createdAt: new Date().toISOString() }],
          lastCollectionId: id,
        }))
        return id
      },
      renameCollection: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        setData((current) => ({
          ...current,
          collections: current.collections.map((item) => (item.id === id ? { ...item, name: trimmed.slice(0, 40) } : item)),
        }))
      },
      deleteCollection: (id) => {
        setData((current) => {
          if (current.collections.length < 2) return current
          const fallback = current.collections.find((item) => item.id !== id)?.id ?? null
          const progress = { ...current.progress }
          for (const [ideaId, item] of Object.entries(progress)) {
            if (item.collectionId === id) progress[ideaId] = { ...item, collectionId: fallback }
          }
          return {
            ...current,
            collections: current.collections.filter((item) => item.id !== id),
            lastCollectionId: current.lastCollectionId === id ? fallback : current.lastCollectionId,
            progress,
          }
        })
      },
      createIdea: (input) => {
        const id = `c-${crypto.randomUUID()}`
        const idea: Idea = {
          id,
          title: input.title.trim(),
          text: input.text.trim(),
          source: input.source.trim(),
          author: input.author.trim(),
          topic: input.topic,
          custom: true,
        }
        setData((current) => ({ ...current, customIdeas: [...current.customIdeas, idea] }))
        return id
      },
      deleteIdea: (id) => {
        setData((current) => {
          const progress = { ...current.progress }
          delete progress[id]
          return {
            ...current,
            customIdeas: current.customIdeas.filter((idea) => idea.id !== id),
            progress,
            planIds: current.planIds.filter((planId) => planId !== id),
          }
        })
      },
      rate: (id, rating) => {
        setData((current) => {
          const today = todayISO()
          const prev = current.progress[id] ?? blankProgress()
          const srs = schedule(prev.srs ?? freshSrs(today), rating, today)
          const remembered = rating === 'good' || rating === 'easy'
          const log = current.days[today] ?? emptyDay()
          return {
            ...current,
            progress: {
              ...current.progress,
              [id]: {
                ...prev,
                srs,
                reviewCount: prev.reviewCount + 1,
                rememberedCount: prev.rememberedCount + (remembered ? 1 : 0),
              },
            },
            days: {
              ...current.days,
              [today]: {
                ...log,
                reviews: log.reviews + 1,
                remembered: log.remembered + (remembered ? 1 : 0),
              },
            },
          }
        })
      },
      importData: (imported) => setData(withPlan(imported, catalog(imported), todayISO())),
      resetProfile: () => setData((current) => ({ ...current, profile: null, planDate: null, planIds: [] })),
      wipe: () => {
        localStorage.removeItem(STORAGE_KEY)
        setData(emptyData())
      },
      rebuildPlan: () => setData((current) => withPlan(current, catalog(current), todayISO())),
    }
  }, [])

  const ideas = useMemo(() => catalog(data), [data])
  const value = useMemo(() => ({ data, ideas, toast, actions }), [data, ideas, toast, actions])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('Store fehlt')
  return value
}

export { serializeBackup }
