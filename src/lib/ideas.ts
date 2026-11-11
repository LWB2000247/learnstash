import raw from '../data/ideas.json'
import { isTopic, type Idea } from '../types'

interface RawIdea {
  id: string
  title: string
  text: string
  source: string
  author: string
  topic: string
}

export const seedIdeas: Idea[] = (raw as RawIdea[]).flatMap((item) =>
  isTopic(item.topic) ? [{ ...item, topic: item.topic }] : [],
)
