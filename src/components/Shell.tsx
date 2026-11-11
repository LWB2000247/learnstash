import { useMemo } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { todayISO } from '../lib/dates'
import { countDue } from '../lib/stats'
import { useStore } from '../state/store'
import { IconHome, IconReview, IconStash, IconStats } from './Icons'

export function Shell() {
  const { data, toast, actions } = useStore()
  const due = useMemo(() => countDue(data.progress, todayISO()), [data.progress])

  return (
    <div className="shell">
      <nav className="tabs" aria-label="Hauptnavigation">
        <p className="nav-brand">Learnstash</p>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <IconHome />
          Heute
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <IconReview />
          Üben
          {due > 0 && <span className="badge">{due > 99 ? '99+' : due}</span>}
        </NavLink>
        <NavLink to="/stash" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <IconStash />
          Stash
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <IconStats />
          Stand
        </NavLink>
      </nav>
      <div className="view">
        <Outlet />
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.()
                actions.dismissToast()
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
