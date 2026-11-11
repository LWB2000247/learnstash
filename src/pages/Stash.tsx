import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconSearch } from '../components/Icons'
import { useTitle } from '../components/useTitle'
import { topicLabel } from '../lib/labels'
import { useStore } from '../state/store'

export function Stash() {
  const { data, ideas, actions } = useStore()
  const [active, setActive] = useState(data.lastCollectionId ?? data.collections[0]?.id ?? '')
  const [likedOnly, setLikedOnly] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  useTitle('Stash')

  const selected = data.collections.find((item) => item.id === active) ?? data.collections[0]
  const saved = ideas.filter((idea) => {
    const progress = data.progress[idea.id]
    if (!progress?.saved || progress.collectionId !== selected?.id) return false
    if (likedOnly && !progress.liked) return false
    return true
  })

  return (
    <main className="page">
      <header className="page-head">
        <h1>Stash</h1>
        <Link to="/search" className="icon-btn" aria-label="Suchen">
          <IconSearch />
        </Link>
      </header>
      <p className="lead">Ideen, die du behalten willst. Sie kommen in der Wiederholung wieder.</p>
      <div className="chips">
        {data.collections.map((collection) => (
          <button key={collection.id} type="button" className="chip" aria-pressed={collection.id === selected?.id} onClick={() => setActive(collection.id)}>
            {collection.name}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => setCreating((value) => !value)}>
          Neu
        </button>
      </div>
      {creating && (
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            const id = actions.createCollection(name)
            if (!id) return
            setActive(id)
            setName('')
            setCreating(false)
          }}
        >
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name der Sammlung" maxLength={40} aria-label="Name der Sammlung" />
          <button className="btn" type="submit" disabled={!name.trim()}>
            Anlegen
          </button>
        </form>
      )}
      {selected && (
        <div className="row-actions">
          {renaming ? (
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault()
                actions.renameCollection(selected.id, name)
                setRenaming(false)
              }}
            >
              <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Neuer Name" maxLength={40} />
              <button className="btn" type="submit">
                Speichern
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setName(selected.name)
                  setRenaming(true)
                }}
              >
                Umbenennen
              </button>
              <button type="button" className={likedOnly ? 'btn' : 'btn secondary'} aria-pressed={likedOnly} onClick={() => setLikedOnly((value) => !value)}>
                Nur mit Herz
              </button>
              {data.collections.length > 1 && (
                <button type="button" className="btn secondary" onClick={() => actions.deleteCollection(selected.id)}>
                  Sammlung löschen
                </button>
              )}
            </>
          )}
        </div>
      )}
      {saved.length === 0 ? (
        <p className="muted">Hier ist noch nichts. Merk dir im Stapel eine Idee, oder schreib eine eigene.</p>
      ) : (
        <div className="stack">
          {saved.map((idea) => (
            <Link key={idea.id} className="result" to={`/idea/${idea.id}`}>
              <span className="kicker">{topicLabel(idea.topic)}</span>
              <strong>{idea.title}</strong>
            </Link>
          ))}
        </div>
      )}
      <Link className="btn" to="/new">
        Eigene Idee
      </Link>
    </main>
  )
}
