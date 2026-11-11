import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CollectionSheet } from '../components/CollectionSheet'
import { IconHeart } from '../components/Icons'
import { useTitle } from '../components/useTitle'
import { dayLabel, todayISO } from '../lib/dates'
import { sourceLine, topicLabel } from '../lib/labels'
import { freshSrs, schedule } from '../lib/sm2'
import { useStore } from '../state/store'
import type { Rating } from '../types'

const RATINGS: { id: Rating; label: string }[] = [
  { id: 'again', label: 'Nochmal' },
  { id: 'hard', label: 'Schwer' },
  { id: 'good', label: 'Gut' },
  { id: 'easy', label: 'Leicht' },
]

export function IdeaDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { ideas, data, actions } = useStore()
  const idea = ideas.find((item) => item.id === id)
  const [sheet, setSheet] = useState(false)
  const [armed, setArmed] = useState(false)
  useTitle(idea?.title ?? 'Idee')

  if (!idea) {
    return (
      <main className="page">
        <h1>Diese Idee gibt es nicht.</h1>
        <Link to="/stash">Zum Stash</Link>
      </main>
    )
  }

  const progress = data.progress[idea.id]
  const today = todayISO()
  const srs = progress?.srs ?? freshSrs(today)

  return (
    <main className="page">
      <header className="page-head">
        <button type="button" className="text-btn" onClick={() => navigate(-1)}>
          Zurück
        </button>
      </header>
      <p className="kicker">{idea.custom ? 'Eigene Idee' : topicLabel(idea.topic)}</p>
      <h1>{idea.title}</h1>
      <p className="idea-text">{idea.text}</p>
      <p className="source">{sourceLine(idea)}</p>
      {progress?.srs && (
        <p className="muted">
          Nächste Wiederholung {progress.srs.due === today ? 'heute' : `am ${progress.srs.due.split('-').reverse().join('.')}`} · Abstand zuletzt {dayLabel(progress.srs.interval || 0)}
        </p>
      )}
      <div className="actions detail-actions">
        <button type="button" className={progress?.saved ? 'btn secondary' : 'btn'} onClick={() => (progress?.saved ? setSheet(true) : actions.saveIdea(idea.id))}>
          {progress?.saved ? 'Gemerkt' : 'Merken'}
        </button>
        <button type="button" className={progress?.liked ? 'icon-btn liked' : 'icon-btn'} aria-label="Gefällt mir" aria-pressed={Boolean(progress?.liked)} onClick={() => actions.toggleLike(idea.id)}>
          <IconHeart filled={Boolean(progress?.liked)} />
        </button>
      </div>
      {progress?.saved && (
        <section>
          <h2>Wie gut sitzt das?</h2>
          <div className="rates">
            {RATINGS.map((rating) => (
              <button
                key={rating.id}
                type="button"
                className={`rate ${rating.id}`}
                onClick={() => {
                  actions.rate(idea.id, rating.id)
                  actions.notify(rating.id === 'again' ? 'Morgen wieder' : `Wieder in ${dayLabel(schedule(srs, rating.id, today).interval)}`)
                }}
              >
                {rating.label}
                <small>{dayLabel(schedule(srs, rating.id, today).interval)}</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {idea.custom && (
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (!armed) {
              setArmed(true)
              return
            }
            actions.deleteIdea(idea.id)
            navigate('/stash')
          }}
        >
          {armed ? 'Wirklich löschen' : 'Eigene Idee löschen'}
        </button>
      )}
      {sheet && <CollectionSheet ideaId={idea.id} onClose={() => setSheet(false)} />}
    </main>
  )
}
