import { Link } from 'react-router-dom'
import { useTitle } from '../components/useTitle'
import { formatDayShort, lastDates, todayISO } from '../lib/dates'
import { percent, topicLabel } from '../lib/labels'
import { bestStreak, currentStreak, topicCounts, totals } from '../lib/stats'
import { useStore } from '../state/store'

export function Stats() {
  const { data, ideas } = useStore()
  const today = todayISO()
  const goal = data.profile?.dailyGoal ?? 5
  const log = data.days[today]
  const seen = log?.seen.length ?? 0
  const streak = currentStreak(data.days, today)
  const longest = bestStreak(data.days)
  const numbers = totals(data.progress)
  const topics = topicCounts(ideas, data.progress)
  const days = lastDates(today, 14)
  const peak = Math.max(1, ...days.map((date) => data.days[date]?.seen.length ?? 0))
  useTitle('Stand')

  const remaining = Math.max(0, goal - seen)
  let streakNote = 'Erreich das Tagesziel, dann beginnt die Serie.'
  if (log?.goalMet) streakNote = 'Heute ist geschafft.'
  else if (streak > 0) streakNote = `Noch ${remaining} bis die Serie heute weiterzählt.`

  return (
    <main className="page">
      <header className="page-head">
        <h1>Stand</h1>
        <Link to="/settings">Einstellungen</Link>
      </header>
      <section className="streak" aria-label="Serie">
        <p className="num">{streak}</p>
        <p>{streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}</p>
        <p className="muted">{streakNote}</p>
        {longest > 0 && <p className="muted">Längste Serie: {longest === 1 ? '1 Tag' : `${longest} Tage`}</p>}
      </section>
      <section>
        <h2>Heute</h2>
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (seen / goal) * 100)}%` }} />
        </div>
        <p className="muted">
          {seen === 1 ? '1 Idee gelesen' : `${seen} Ideen gelesen`}. Ziel: {goal}. Wiederholt heute: {log?.reviews ?? 0}.
        </p>
      </section>
      <section className="stats-grid">
        <article className="stat">
          <b>{numbers.read}</b>
          <span>gelesen</span>
        </article>
        <article className="stat">
          <b>{numbers.saved}</b>
          <span>gemerkt</span>
        </article>
        <article className="stat">
          <b>{numbers.reviews}</b>
          <span>wiederholt</span>
        </article>
        <article className="stat">
          <b>{numbers.retention == null ? '—' : percent(numbers.retention)}</b>
          <span>behalten</span>
        </article>
      </section>
      <p className="muted">Behalten ist der Anteil der Bewertungen Gut oder Leicht.</p>
      <section>
        <h2>Letzte 14 Tage</h2>
        <div className="chart" aria-hidden="true">
          {days.map((date) => {
            const count = data.days[date]?.seen.length ?? 0
            return (
              <div key={date} className={date === today ? 'col today' : 'col'} title={`${formatDayShort(date)}: ${count}`}>
                <div className="bar" style={{ height: `${Math.max(4, (count / peak) * 100)}%` }} />
              </div>
            )
          })}
        </div>
        <div className="chart-labels">
          <span>{formatDayShort(days[0] ?? today)}</span>
          <span>heute</span>
        </div>
      </section>
      {topics.length > 0 && (
        <section>
          <h2>Themen</h2>
          <div className="topic-bars">
            {topics.map((item) => (
              <div key={item.topic}>
                <div className="topic-label">
                  <span>{topicLabel(item.topic)}</span>
                  <span>{item.count}</span>
                </div>
                <div className="meter" aria-hidden="true">
                  <span style={{ width: `${(item.count / (topics[0]?.count || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
