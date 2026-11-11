import { useState } from 'react'
import { useStore } from '../state/store'
import { Sheet } from './Sheet'

export function CollectionSheet({ ideaId, onClose }: { ideaId: string; onClose: () => void }) {
  const { data, actions } = useStore()
  const [name, setName] = useState('')
  const progress = data.progress[ideaId]
  const savedId = progress?.saved ? progress.collectionId : null

  return (
    <Sheet title="Wohin damit?" onClose={onClose}>
      <div className="stack">
        {data.collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            className={savedId === collection.id ? 'choice on' : 'choice'}
            onClick={() => {
              actions.saveIdea(ideaId, collection.id)
              actions.notify(`In ${collection.name} gespeichert`)
              onClose()
            }}
          >
            <span>{collection.name}</span>
            {savedId === collection.id && <span className="muted">aktuell</span>}
          </button>
        ))}
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            const id = actions.createCollection(name)
            if (!id) return
            actions.saveIdea(ideaId, id)
            actions.notify(`In ${name.trim()} gespeichert`)
            onClose()
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Neue Sammlung"
            maxLength={40}
            aria-label="Name der neuen Sammlung"
          />
          <button type="submit" className="btn" disabled={!name.trim()}>
            Anlegen
          </button>
        </form>
        {progress?.saved && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              actions.unsave(ideaId)
              actions.notify('Aus dem Stash genommen')
              onClose()
            }}
          >
            Aus dem Stash entfernen
          </button>
        )}
      </div>
    </Sheet>
  )
}
