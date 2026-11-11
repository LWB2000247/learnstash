import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTitle } from '../components/useTitle'
import { ideaCount, topicLabel } from '../lib/labels'
import { useStore } from '../state/store'
import { TOPICS, type TopicId } from '../types'

export function Search() {
  const { data, ideas } = useStore()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<TopicId | 'alle'>('alle')
  const [collectionId, setCollectionId] = useState('alle')
  const [only, setOnly] = useState<'alle' | 'stash' | 'liked'>('alle')
  useTitle('Suche')

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('de')
    return ideas.filter((idea) => {
      const progress = data.progress[idea.id]
      if (topic !== 'alle' && idea.topic !== topic) return false
      if (collectionId !== 'alle' && progress?.collectionId !== collectionId) return false
      if (only === 'stash' && !progress?.saved) return false
      if (only === 'liked' && !progress?.liked) return false
      if (!needle) return true
      const hay = `${idea.title} ${idea.text} ${idea.source} ${idea.author}`.toLocaleLowerCase('de')
      return hay.includes(needle)
    })
  }, [ideas, data.progress, query, topic, collectionId, only])

  return (
    <main className="page">
      <h1>Suche</h1>
      <label className="field">
        Begriff
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Quelle, Wortlaut" />
      </label>
      <div className="chips" role="group" aria-label="Thema">
        <button type="button" className="chip" aria-pressed={topic === 'alle'} onClick={() => setTopic('alle')}>
          Alle Themen
        </button>
        {TOPICS.map((item) => (
          <button key={item.id} type="button" className="chip" aria-pressed={topic === item.id} onClick={() => setTopic(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="filters">
        <label className="field">
          Sammlung
          <select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
            <option value="alle">Alle Sammlungen</option>
            {data.collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>
        <div className="chips" role="group" aria-label="Status">
          {(
            [
              ['alle', 'Alles'],
              ['stash', 'Gemerkt'],
              ['liked', 'Mit Herz'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className="chip" aria-pressed={only === id} onClick={() => setOnly(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="muted">{ideaCount(results.length)}</p>
      <div className="stack">
        {results.slice(0, 80).map((idea) => (
          <Link key={idea.id} className="result" to={`/idea/${idea.id}`}>
            <span className="kicker">{topicLabel(idea.topic)}</span>
            <strong>{idea.title}</strong>
            <span>{idea.source}</span>
          </Link>
        ))}
      </div>
      {results.length > 80 && <p className="muted">Die ersten 80 Treffer. Grenz die Suche weiter ein.</p>}
    </main>
  )
}
