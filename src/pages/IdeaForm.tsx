import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTitle } from '../components/useTitle'
import { useStore } from '../state/store'
import { TOPICS, type TopicId } from '../types'

export function IdeaForm() {
  const { actions } = useStore()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [author, setAuthor] = useState('')
  const [topic, setTopic] = useState<TopicId>('lernen')
  const [error, setError] = useState('')
  useTitle('Neue Idee')

  return (
    <main className="page">
      <header className="page-head">
        <h1>Neue Idee</h1>
        <Link to="/stash">Abbrechen</Link>
      </header>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          if (title.trim().length < 3) {
            setError('Der Titel ist zu kurz.')
            return
          }
          if (text.trim().length < 40) {
            setError('Schreib mindestens zwei Sätze.')
            return
          }
          if (source.trim().length < 2) {
            setError('Nenn eine Quelle.')
            return
          }
          const id = actions.createIdea({ title, text, source, author, topic })
          actions.notify('Idee hinzugefügt')
          navigate(`/idea/${id}`)
        }}
      >
        <label className="field">
          Titel
          <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          Text
          <textarea value={text} maxLength={1200} rows={6} onChange={(event) => setText(event.target.value)} placeholder="Zwei bis fünf Sätze." />
        </label>
        <label className="field">
          Quelle
          <input value={source} maxLength={160} onChange={(event) => setSource(event.target.value)} placeholder="Buch, Artikel oder Gespräch" />
        </label>
        <label className="field">
          Autor
          <input value={author} maxLength={120} onChange={(event) => setAuthor(event.target.value)} placeholder="optional" />
        </label>
        <label className="field">
          Thema
          <select value={topic} onChange={(event) => setTopic(event.target.value as TopicId)}>
            {TOPICS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="muted">{error}</p>}
        <button className="btn" type="submit">
          Speichern
        </button>
      </form>
    </main>
  )
}
