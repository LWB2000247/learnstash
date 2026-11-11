import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { IdeaDetail } from './pages/IdeaDetail'
import { IdeaForm } from './pages/IdeaForm'
import { Feed } from './pages/Feed'
import { Onboarding } from './pages/Onboarding'
import { Review } from './pages/Review'
import { Search } from './pages/Search'
import { Settings } from './pages/Settings'
import { Stash } from './pages/Stash'
import { Stats } from './pages/Stats'
import { useStore } from './state/store'

function Gate() {
  const { data } = useStore()
  if (!data.profile) return <Onboarding />
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Feed />} />
          <Route path="/review" element={<Review />} />
          <Route path="/stash" element={<Stash />} />
          <Route path="/search" element={<Search />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/new" element={<IdeaForm />} />
          <Route path="/idea/:id" element={<IdeaDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export function App() {
  return <Gate />
}
