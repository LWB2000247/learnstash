import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { StoreProvider } from './state/store'
import { STORAGE_KEY } from './lib/backup'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import '@fontsource/source-sans-3/latin-700.css'
import '@fontsource/source-serif-4/latin-400.css'
import '@fontsource/source-serif-4/latin-600.css'
import './styles.css'

registerSW({ immediate: true })

class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }

  static getDerivedStateFromError() {
    return { error: true }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page">
          <h1>Etwas ist schiefgelaufen.</h1>
          <p className="lead">Die lokalen Daten lassen sich zurücksetzen. Ein Export, den du schon gespeichert hast, bleibt auf dem Gerät.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              location.reload()
            }}
          >
            Daten zurücksetzen
          </button>
        </main>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Boundary>
        <StoreProvider>
          <App />
        </StoreProvider>
      </Boundary>
    </StrictMode>,
  )
}
