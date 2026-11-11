import { topicById, type Idea, type TopicId } from '../types'

export function topicLabel(id: TopicId): string {
  return topicById(id).label
}

export function sourceLine(idea: Pick<Idea, 'source' | 'author'>): string {
  return idea.author ? `${idea.source} · ${idea.author}` : idea.source
}

export function ideaCount(count: number): string {
  return count === 1 ? '1 Idee' : `${count} Ideen`
}

export function percent(value: number): string {
  return `${Math.round(value * 100)} %`
}
