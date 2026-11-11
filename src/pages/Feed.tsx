import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CollectionSheet } from '../components/CollectionSheet'
import { IconHeart, IconSearch } from '../components/Icons'
import { useTitle } from '../components/useTitle'
import { todayISO } from '../lib/dates'
import { sourceLine, topicLabel } from '../lib/labels'
import { orderFeed } from '../lib/plan'
import { useStore } from '../state/store'

export function Feed() {
  const { data, ideas, actions } = useStore()
  const interests = data.profile?.interests ?? []
  const queue = useMemo(() => orderFeed(ideas, data.planIds, interests), [ideas, data.planIds, interests])
  const planKey = `${data.planDate}:${data.planIds.join('|')}`
  const [index, setIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [moving, setMoving] = useState(false)
  const [sheetFor, setSheetFor] = useState<string | null>(null)
  const indexRef = useRef(index)
  const queueRef = useRef(queue)
  const animLock = useRef(false)
  const pointerId = useRef<number | null>(null)
  const startY = useRef(0)
  const stageRef = useRef<HTMLDivElement>(null)
  indexRef.current = index
  queueRef.current = queue
  useTitle('Heute')

  useEffect(() => {
    const first = queue.findIndex((idea) => !data.progress[idea.id]?.seenAt)
    setIndex(first === -1 ? 0 : first)
    // Only jump when today's plan changes. Progress updates must not rewind the stack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey])

  useEffect(() => {
    setIndex((current) => Math.min(current, queue.length))
  }, [queue.length])

  function commit(dir: 1 | -1) {
    if (animLock.current) return
    const current = indexRef.current
    const next = current + dir
    const items = queueRef.current
    if (next < 0 || next > items.length) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finish = () => {
      if (dir === 1 && items[current]) actions.markSeen(items[current].id)
      setIndex(next)
      setOffset(0)
      setMoving(false)
      animLock.current = false
    }
    animLock.current = true
    if (reduced) {
      finish()
      return
    }
    setMoving(true)
    setOffset(dir === 1 ? -Math.min(window.innerHeight * 0.72, 640) : Math.min(window.innerHeight * 0.4, 320))
    window.setTimeout(finish, 180)
  }

  const commitRef = useRef(commit)
  commitRef.current = commit

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    let wheelLock = false
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (wheelLock || animLock.current || Math.abs(event.deltaY) < 24) return
      wheelLock = true
      commitRef.current(event.deltaY > 0 ? 1 : -1)
      window.setTimeout(() => {
        wheelLock = false
      }, 480)
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [index >= queue.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (sheetFor) return
      if (event.key === 'ArrowDown' || event.key === 'j') {
        event.preventDefault()
        commitRef.current(1)
      } else if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault()
        commitRef.current(-1)
      } else if (event.key === 'm' || event.key === 'M') {
        event.preventDefault()
        saveRef.current()
      } else if (event.key === 'l' || event.key === 'L') {
        event.preventDefault()
        likeRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetFor])

  const idea = index < queue.length ? queue[index] : undefined
  const progress = idea ? data.progress[idea.id] : undefined
  const today = todayISO()
  const seen = data.days[today]?.seen.length ?? 0
  const goal = data.profile?.dailyGoal ?? 5
  const planPos = idea ? data.planIds.indexOf(idea.id) : -1

  function saveCurrent() {
    if (!idea) return
    if (data.progress[idea.id]?.saved) {
      setSheetFor(idea.id)
      return
    }
    actions.saveIdea(idea.id)
    actions.markSeen(idea.id)
    const collection =
      data.collections.find((item) => item.id === data.lastCollectionId) ?? data.collections[0]
    const name = collection?.name ?? 'Mein Stash'
    actions.notify(`In ${name} gespeichert`, { label: 'Ändern', run: () => setSheetFor(idea.id) })
  }

  function likeCurrent() {
    if (!idea) return
    actions.toggleLike(idea.id)
    actions.markSeen(idea.id)
  }

  const saveRef = useRef(saveCurrent)
  const likeRef = useRef(likeCurrent)
  saveRef.current = saveCurrent
  likeRef.current = likeCurrent

  return (
    <section className="feed">
      <header className="feed-top">
        <div>
          <p className="brand">Learnstash</p>
          <p className="progress-label">
            {Math.min(seen, goal)} von {goal} heute
            {data.days[today]?.goalMet ? ' · geschafft' : ''}
          </p>
        </div>
        <Link to="/search" className="icon-btn" aria-label="Suchen">
          <IconSearch />
        </Link>
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (seen / goal) * 100)}%` }} />
        </div>
      </header>
      {idea ? (
        <>
          <div
            className="stage"
            ref={stageRef}
            tabIndex={0}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest('button, a')) return
              pointerId.current = event.pointerId
              startY.current = event.clientY
              setMoving(false)
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (pointerId.current !== event.pointerId) return
              setOffset(event.clientY - startY.current)
            }}
            onPointerUp={(event) => {
              if (pointerId.current !== event.pointerId) return
              pointerId.current = null
              const delta = event.clientY - startY.current
              if (delta < -72) commit(1)
              else if (delta > 72) commit(-1)
              else {
                setMoving(true)
                setOffset(0)
              }
            }}
            onPointerCancel={() => {
              pointerId.current = null
              setMoving(true)
              setOffset(0)
            }}
          >
            {queue[index + 1] && (
              <article className="card under" aria-hidden="true">
                <p className="kicker">{queue[index + 1].custom ? 'Eigene Idee' : topicLabel(queue[index + 1].topic)}</p>
                <h2>{queue[index + 1].title}</h2>
              </article>
            )}
            <article
              className="card front"
              style={{ transform: `translateY(${offset}px)`, transition: moving ? 'transform 180ms ease' : 'none' }}
            >
              <p className="kicker">{idea.custom ? 'Eigene Idee' : topicLabel(idea.topic)}</p>
              {planPos >= 0 && (
                <p className="meta">
                  Im Plan · {planPos + 1} von {data.planIds.length}
                </p>
              )}
              <h1>{idea.title}</h1>
              <p className="idea-text">{idea.text}</p>
              <p className="source">{sourceLine(idea)}</p>
            </article>
          </div>
          <p className="hints">Pfeiltasten oder Scrollen · M merken · L gefällt mir</p>
          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => commit(1)}>
              Weiter
            </button>
            <button type="button" className={progress?.liked ? 'icon-btn liked' : 'icon-btn'} aria-pressed={Boolean(progress?.liked)} aria-label={progress?.liked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'} onClick={likeCurrent}>
              <IconHeart filled={Boolean(progress?.liked)} />
            </button>
            <button type="button" className={progress?.saved ? 'btn secondary' : 'btn'} onClick={saveCurrent}>
              {progress?.saved ? 'Gemerkt' : 'Merken'}
            </button>
          </div>
        </>
      ) : (
        <div className="page empty-state">
          <h1>Stapel für heute durch.</h1>
          <p className="lead">
            {seen} von {goal} Ideen gelesen.
            {data.days[today]?.goalMet ? ' Das Tagesziel ist erreicht.' : ' Wisch noch ein paar bekannte Karten, oder komm später wieder.'}
          </p>
          <div className="stack">
            <Link className="btn" to="/review">
              Zur Wiederholung
            </Link>
            <button type="button" className="btn secondary" onClick={() => setIndex(0)}>
              Von vorn
            </button>
          </div>
        </div>
      )}
      {sheetFor && <CollectionSheet ideaId={sheetFor} onClose={() => setSheetFor(null)} />}
    </section>
  )
}
