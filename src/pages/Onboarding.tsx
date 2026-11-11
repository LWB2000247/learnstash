import { useMemo, useState } from 'react'
import { makePlan } from '../lib/plan'
import { todayISO } from '../lib/dates'
import { topicLabel } from '../lib/labels'
import { useStore } from '../state/store'
import { DAILY_GOALS, GOALS, TOPICS, type DailyGoal, type GoalId, type TopicId } from '../types'
import { useTitle } from '../components/useTitle'

const MINUTES: Record<DailyGoal, string> = {
  5: 'etwa 3 Minuten',
  10: 'etwa 6 Minuten',
  15: 'etwa 10 Minuten',
}

export function Onboarding() {
  const { data, ideas, actions } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(data.profile?.name || 'Leon')
  const [goals, setGoals] = useState<GoalId[]>([])
  const [interests, setInterests] = useState<TopicId[]>([])
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(10)
  useTitle('Einrichtung')

  const planIds = useMemo(
    () => makePlan(ideas, interests, dailyGoal, data.progress, todayISO()),
    [ideas, interests, dailyGoal, data.progress],
  )
  const plan = planIds
    .map((id) => ideas.find((idea) => idea.id === id))
    .filter((idea): idea is NonNullable<typeof idea> => Boolean(idea))

  function toggleGoal(id: GoalId) {
    setGoals((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function toggleTopic(id: TopicId) {
    setInterests((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const canNext = (step === 1 && goals.length > 0) || (step === 2 && interests.length > 0) || step === 0 || step === 3

  return (
    <main className="onboard">
      <div className="onboard-inner">
        <p className="eyebrow">Schritt {step + 1} von 5</p>
        {step === 0 && (
          <>
            <h1>Weniger scrollen. Mehr behalten.</h1>
            <p className="lead">
              Learnstash ist ein kleiner Stapel kurzer Ideen. Du wischst sie durch, merkst dir, was zählt, und wiederholst es, bevor es verschwindet.
            </p>
            <label className="field">
              Dein Name
              <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
            </label>
            <p className="muted">Alles bleibt auf diesem Gerät. Kein Konto, keine Cloud.</p>
          </>
        )}
        {step === 1 && (
          <>
            <h1>Was soll sich ändern?</h1>
            <p className="lead">Wähl, worauf der Stapel einzahlen soll. Mehreres ist erlaubt.</p>
            <div className="stack">
              {GOALS.map((goal) => (
                <button key={goal.id} type="button" className={goals.includes(goal.id) ? 'choice on' : 'choice'} aria-pressed={goals.includes(goal.id)} onClick={() => toggleGoal(goal.id)}>
                  <span className="mark" aria-hidden="true" />
                  <span>{goal.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1>Welche Themen interessieren dich?</h1>
            <p className="lead">Daraus wird dein Tagesplan. Du kannst die Auswahl später ändern.</p>
            <div className="stack">
              {TOPICS.map((topic) => (
                <button key={topic.id} type="button" className={interests.includes(topic.id) ? 'choice on' : 'choice'} aria-pressed={interests.includes(topic.id)} onClick={() => toggleTopic(topic.id)}>
                  <span className="mark" aria-hidden="true" />
                  <span>
                    <strong>{topic.label}</strong>
                    <span className="muted">{topic.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1>Wie viele Ideen am Tag?</h1>
            <p className="lead">Die Serie zählt, wenn du dieses Ziel im Stapel erreichst.</p>
            <div className="stack">
              {DAILY_GOALS.map((goal) => (
                <button key={goal} type="button" className={dailyGoal === goal ? 'choice on' : 'choice'} aria-pressed={dailyGoal === goal} onClick={() => setDailyGoal(goal)}>
                  <span>
                    <strong>{goal} Ideen</strong>
                    <span className="muted">{MINUTES[goal]}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h1>Dein Plan für heute{name.trim() ? `, ${name.trim()}` : ''}.</h1>
            <p className="lead">
              {plan.length} Ideen aus deinen Themen. Was du merkst, landet im Stash und in der Wiederholung.
            </p>
            <ol className="plan-list">
              {plan.map((idea) => (
                <li key={idea.id}>
                  <span className="kicker">{topicLabel(idea.topic)}</span>
                  <strong>{idea.title}</strong>
                </li>
              ))}
            </ol>
          </>
        )}
        <div className="onboard-actions">
          {step > 0 && (
            <button type="button" className="btn secondary" onClick={() => setStep((value) => value - 1)}>
              Zurück
            </button>
          )}
          {step < 4 ? (
            <button type="button" className="btn" disabled={!canNext} onClick={() => setStep((value) => value + 1)}>
              Weiter
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() =>
                actions.completeOnboarding({
                  name,
                  goals,
                  interests,
                  dailyGoal,
                  planIds,
                })
              }
            >
              Heute starten
            </button>
          )}
        </div>
        {step > 0 && step < 4 && !canNext && <p className="muted">Wähl mindestens einen Punkt.</p>}
      </div>
    </main>
  )
}
