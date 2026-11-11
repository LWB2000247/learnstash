export const TOPICS = [
  { id: 'produktivitaet', label: 'Produktivität', blurb: 'Fokus, Gewohnheiten, Zeit' },
  { id: 'geld', label: 'Geld und Business', blurb: 'Vermögen, Unternehmen, Entscheidungen' },
  { id: 'marketing', label: 'Sales und Marketing', blurb: 'Angebote, Einfluss, Nachfrage' },
  { id: 'psychologie', label: 'Psychologie', blurb: 'Denken, Verhalten, Vorurteile' },
  { id: 'gesundheit', label: 'Gesundheit', blurb: 'Schlaf, Körper, Energie' },
  { id: 'kommunikation', label: 'Kommunikation', blurb: 'Gespräche, Verhandeln, Klarheit' },
  { id: 'lernen', label: 'Lernen lernen', blurb: 'Erinnern, Üben, Notizen' },
  { id: 'philosophie', label: 'Philosophie', blurb: 'Urteil, Stoa, ein gutes Leben' },
] as const

export type TopicId = (typeof TOPICS)[number]['id']

export const TOPIC_IDS: TopicId[] = TOPICS.map((topic) => topic.id)

export const GOALS = [
  { id: 'denken', label: 'Klarer denken' },
  { id: 'entscheiden', label: 'Besser entscheiden' },
  { id: 'scrollen', label: 'Weniger ziellos scrollen' },
  { id: 'geld', label: 'Geld und Arbeit verstehen' },
  { id: 'gesund', label: 'Gesünder leben' },
  { id: 'sprechen', label: 'Besser zuhören und sprechen' },
  { id: 'behalten', label: 'Dinge wirklich behalten' },
] as const

export type GoalId = (typeof GOALS)[number]['id']

export const GOAL_IDS: GoalId[] = GOALS.map((goal) => goal.id)

export const DAILY_GOALS = [5, 10, 15] as const

export type DailyGoal = (typeof DAILY_GOALS)[number]

export type ThemeChoice = 'system' | 'light' | 'dark'

export interface Idea {
  id: string
  title: string
  text: string
  source: string
  author: string
  topic: TopicId
  custom?: boolean
}

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  ease: number
  interval: number
  repetitions: number
  due: string
  lapses: number
}

export interface IdeaProgress {
  saved: boolean
  collectionId: string | null
  liked: boolean
  seenAt: string | null
  srs: SrsState | null
  reviewCount: number
  rememberedCount: number
}

export interface Collection {
  id: string
  name: string
  createdAt: string
}

export interface DayLog {
  seen: string[]
  reviews: number
  remembered: number
  goalMet: boolean
}

export interface Profile {
  name: string
  goals: GoalId[]
  interests: TopicId[]
  dailyGoal: DailyGoal
  createdAt: string
}

export interface AppData {
  version: 1
  profile: Profile | null
  customIdeas: Idea[]
  collections: Collection[]
  progress: Record<string, IdeaProgress>
  days: Record<string, DayLog>
  lastCollectionId: string | null
  theme: ThemeChoice
  planDate: string | null
  planIds: string[]
}

export function isTopic(value: string): value is TopicId {
  return (TOPIC_IDS as string[]).includes(value)
}

export function isGoal(value: string): value is GoalId {
  return (GOAL_IDS as string[]).includes(value)
}

export function isDailyGoal(value: number): value is DailyGoal {
  return value === 5 || value === 10 || value === 15
}

export function topicById(id: TopicId) {
  return TOPICS.find((topic) => topic.id === id) ?? TOPICS[0]
}
