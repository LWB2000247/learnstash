import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTitle } from '../components/useTitle'
import { dayLabel, todayISO } from '../lib/dates'
import { sourceLine, topicLabel } from '../lib/labels'
import { freshSrs, schedule } from '../lib/sm2'
import { dueIdeas } from '../lib/stats'
import { useStore } from '../state/store'
import type { Rating } from '../types'

const RATINGS: { id: Rating; label: string }[] = [
  { id: 'again', label: 'Nochmal' },
  { id: 'hard', label: 'Schwer' },
  { id: 'good', label: 'Gut' },
  { id: 'easy', label: 'Leicht' },
]

export function Review() {
  const { data, ideas, actions } = useStore()
  const today = todayISO()
  const queue = dueIdeas(ideas, data.progress, today)
  const current = queue[0]
  const [revealed, setRevealed] = useState(false)
  const [round, setRound] = useState({ reviews: 0, remembered: 0 })
  useTitle('Üben')

  useEffect(() => {
    setRevealed(false)
  }, [current?.id])

  if (!current) {
    return (
      <main className="page">
        <h1>{round.reviews > 0 ? 'Runde fertig.' : 'Nichts ist fällig.'}</h1>
        {round.reviews > 0 ? (
          <p className="lead">
            {round.reviews} wiederholt, davon {round.remembered} mit Gut oder Leicht.
          </p>
        ) : (
          <p className="lead">
            Merk dir Ideen im Stapel. Sie erscheinen hier zum Abfragen. Danach bestimmt deine Bewertung, wann sie wiederkommen.
          </p>
        )}
        <Link className="btn" to="/">
          Zurück zum Stapel
        </Link>
      </main>
    )
  }

  const srs = data.progress[current.id]?.srs ?? freshSrs(today)

  return (
    <main className="review">
      <header className="feed-top">
        <div>
          <p className="brand">Wiederholung</p>
          <p className="progress-label">{queue.length} fällig</p>
        </div>
      </header>
      <article className="card review-card">
        <p className="kicker">{topicLabel(current.topic)}</p>
        <h1>{current.title}</h1>
        {!revealed ? (
          <>
            <p className="prompt">Was war der Gedanke? Sag ihn dir in einem Satz, bevor du aufdeckst.</p>
            <button type="button" className="btn" onClick={() => setRevealed(true)}>
              Aufdecken
            </button>
          </>
        ) : (
          <>
            <p className="idea-text">{current.text}</p>
            <p className="source">{sourceLine(current)}</p>
            <div className="rates">
              {RATINGS.map((rating) => (
                <button
                  key={rating.id}
                  type="button"
                  className={`rate ${rating.id}`}
                  onClick={() => {
                    actions.rate(current.id, rating.id)
                    setRound((value) => ({
                      reviews: value.reviews + 1,
                      remembered: value.remembered + (rating.id === 'good' || rating.id === 'easy' ? 1 : 0),
                    }))
                  }}
                >
                  {rating.label}
                  <small>{dayLabel(schedule(srs, rating.id, today).interval)}</small>
                </button>
              ))}
            </div>
          </>
        )}
      </article>
    </main>
  )
}
