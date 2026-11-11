import { describe, expect, it } from 'vitest'
import raw from './ideas.json'
import { TOPIC_IDS, isTopic } from '../types'

interface Card {
  id: string
  topic: string
  title: string
  text: string
  source: string
  author: string
}

const cards = raw as Card[]

function sentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

describe('seed library', () => {
  it('has at least 150 original cards across every topic', () => {
    expect(cards.length).toBeGreaterThanOrEqual(150)
    const counts = new Map<string, number>()
    for (const card of cards) counts.set(card.topic, (counts.get(card.topic) ?? 0) + 1)
    for (const topic of TOPIC_IDS) expect(counts.get(topic) ?? 0).toBeGreaterThanOrEqual(15)
  })

  it('uses unique ids and complete German fields', () => {
    const ids = new Set<string>()
    for (const card of cards) {
      expect(ids.has(card.id)).toBe(false)
      ids.add(card.id)
      expect(card.title.trim().length).toBeGreaterThan(8)
      expect(card.source.trim().length).toBeGreaterThan(1)
      expect(card.author.trim().length).toBeGreaterThan(1)
      expect(isTopic(card.topic)).toBe(true)
      expect(card.text).toMatch(/[äöüÄÖÜß]/)
      const count = sentences(card.text).length
      expect(count, card.id).toBeGreaterThanOrEqual(2)
      expect(count, card.id).toBeLessThanOrEqual(5)
    }
  })
})
