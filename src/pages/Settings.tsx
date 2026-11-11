import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTitle } from '../components/useTitle'
import { parseBackup, serializeBackup } from '../lib/backup'
import { todayISO } from '../lib/dates'
import { useStore } from '../state/store'
import { DAILY_GOALS, GOALS, TOPICS, type DailyGoal, type GoalId, type ThemeChoice, type TopicId } from '../types'

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
]

export function Settings() {
  const { data, actions } = useStore()
  const profile = data.profile
  const [name, setName] = useState(profile?.name ?? 'Leon')
  const [goals, setGoals] = useState<GoalId[]>(profile?.goals ?? [])
  const [interests, setInterests] = useState<TopicId[]>(profile?.interests ?? [])
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(profile?.dailyGoal ?? 10)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null)
  const [armed, setArmed] = useState<'wipe' | 'reset' | null>(null)
  useTitle('Einstellungen')

  if (!profile) return null

  function toggle<T extends string>(list: T[], id: T, set: (value: T[]) => void) {
    set(list.includes(id) ? list.filter((item) => item !== id) : [...list, id])
  }

  function exportData() {
    const blob = new Blob([serializeBackup(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `learnstash-${todayISO()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const savedCount = pending ? Object.values(pending.progress).filter((item) => item.saved).length : 0

  return (
    <main className="page">
      <header className="page-head">
        <h1>Einstellungen</h1>
        <Link to="/stats">Zurück</Link>
      </header>
      <section className="stack">
        <h2>Darstellung</h2>
        <div className="chips">
          {THEMES.map((theme) => (
            <button key={theme.id} type="button" className="chip" aria-pressed={data.theme === theme.id} onClick={() => actions.setTheme(theme.id)}>
              {theme.label}
            </button>
          ))}
        </div>
      </section>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          if (interests.length === 0) {
            setMessage('Lass mindestens ein Thema ausgewählt.')
            return
          }
          actions.updateProfile({ name, goals, interests, dailyGoal })
          setMessage('Gespeichert.')
        }}
      >
        <h2>Dein Plan</h2>
        <label className="field">
          Name
          <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <p className="label">Tagesziel</p>
        <div className="chips">
          {DAILY_GOALS.map((goal) => (
            <button key={goal} type="button" className="chip" aria-pressed={dailyGoal === goal} onClick={() => setDailyGoal(goal)}>
              {goal}
            </button>
          ))}
        </div>
        <p className="label">Ziele</p>
        <div className="chips">
          {GOALS.map((goal) => (
            <button key={goal.id} type="button" className="chip" aria-pressed={goals.includes(goal.id)} onClick={() => toggle(goals, goal.id, setGoals)}>
              {goal.label}
            </button>
          ))}
        </div>
        <p className="label">Themen</p>
        <div className="chips">
          {TOPICS.map((topic) => (
            <button key={topic.id} type="button" className="chip" aria-pressed={interests.includes(topic.id)} onClick={() => toggle(interests, topic.id, setInterests)}>
              {topic.label}
            </button>
          ))}
        </div>
        <button className="btn" type="submit">
          Übernehmen
        </button>
        {message && <p className="muted">{message}</p>}
      </form>
      <section className="stack">
        <h2>Sicherung</h2>
        <p className="muted">Exportiert Profil, eigene Ideen, Stash und den Wiederholungsstand. Die mitgelieferte Bibliothek bleibt in der App.</p>
        <button type="button" className="btn secondary" onClick={exportData}>
          JSON exportieren
        </button>
        <label className="btn secondary file-btn">
          JSON importieren
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              const parsed = parseBackup(await file.text())
              if (!parsed) {
                setPending(null)
                setMessage('Diese Datei ist kein Learnstash-Backup.')
                return
              }
              setMessage('')
              setPending(parsed)
            }}
          />
        </label>
        {pending && (
          <div className="notice">
            <p>
              {pending.customIdeas.length} eigene Ideen, {savedCount} gemerkte Karten. Das ersetzt die Daten auf diesem Gerät.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                actions.importData(pending)
                setPending(null)
                setMessage('Backup eingespielt.')
              }}
            >
              Ersetzen
            </button>
          </div>
        )}
      </section>
      <section className="stack">
        <h2>Tastatur</h2>
        <p className="muted">Im Stapel: Pfeil runter oder Scrollen für die nächste Idee, Pfeil hoch zurück, M merken, L Herz.</p>
      </section>
      <section className="stack">
        <h2>Über Learnstash</h2>
        <p className="muted">
          Die Karten fassen bekannte Ideen in eigenen Worten zusammen und nennen die Quelle. Sie ersetzen die Bücher nicht. Es gibt kein Konto. Was du speicherst, bleibt in diesem Browser, auch offline.
        </p>
      </section>
      <section className="stack danger-zone">
        <button type="button" className="btn secondary" onClick={() => (armed === 'reset' ? actions.resetProfile() : setArmed('reset'))}>
          {armed === 'reset' ? 'Einrichtung wirklich neu starten' : 'Einrichtung wiederholen'}
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (armed !== 'wipe') {
              setArmed('wipe')
              return
            }
            actions.wipe()
          }}
        >
          {armed === 'wipe' ? 'Wirklich alles löschen' : 'Alle lokalen Daten löschen'}
        </button>
      </section>
    </main>
  )
}
