import { useEffect, useRef, type KeyboardEvent } from 'react'
import { Icon } from './components/Icon'
import { ThemeSwitch } from './components/ThemeSwitch'
import { useHashRoute } from './hooks/useHashRoute'
import { useTheme } from './hooks/useTheme'
import { VIEWS, type ViewId } from './lib/routes'
import { CasesView } from './views/CasesView'
import { FinancialView } from './views/FinancialView'
import { LineageView } from './views/LineageView'
import { OperationsView } from './views/OperationsView'
import { OverviewView } from './views/OverviewView'
import styles from './App.module.css'

export const CREDIT =
  'Team project · AIT 506 Machine Learning, Westcliff University · Console designed and built by Divya Gopal'

export default function App() {
  const { route, navigate } = useHashRoute()
  const { preference, setPreference } = useTheme()
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({})
  const view = route.view
  const lastView = useRef<ViewId>(view)

  useEffect(() => {
    if (lastView.current !== view) {
      lastView.current = view
      if (!route.params.get('src')) window.scrollTo({ top: 0 })
    }
  }, [view, route.params])

  const select = (id: ViewId) => navigate(id)

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = VIEWS.length - 1
    const target =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (target === null) return
    e.preventDefault()
    const next = VIEWS[target]
    if (!next) return
    select(next.id)
    tabs.current[next.id]?.focus()
  }

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => {
        e.preventDefault()
        document.getElementById('main')?.focus()
      }}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`container ${styles.bar}`}>
          <a className={styles.brand} href="#/overview" aria-label="CEROP Risk Console, overview">
            <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" />
              <path d="M8 21.5 13 15l4 3.5 7-9" />
              <circle cx="24" cy="9.5" r="2.2" />
            </svg>
            <span className={styles.brandText}>
              <span className={styles.brandName}>CEROP</span>
              <span className={styles.brandSub}>Risk Console</span>
            </span>
          </a>
          <p className={styles.tagline}>Cross-Border Enterprise Risk &amp; Operations Predictor</p>
          <ThemeSwitch value={preference} onChange={setPreference} />
        </div>
        <nav className={styles.nav} aria-label="Console views">
          <div className="container">
            <div className={styles.tablist} role="tablist" aria-label="Console views">
              {VIEWS.map((v, i) => {
                const selected = v.id === view
                return (
                  <button
                    key={v.id}
                    ref={(el) => {
                      tabs.current[v.id] = el
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${v.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${v.id}`}
                    tabIndex={selected ? 0 : -1}
                    className={styles.tab}
                    onClick={() => select(v.id)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className={`container ${styles.main}`}
      >
        <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`} className={styles.panel}>
          {view === 'overview' && <OverviewView onNavigate={select} />}
          {view === 'financial' && <FinancialView />}
          {view === 'operations' && (
            <OperationsView
              threshold={route.params.get('t')}
              onThreshold={(t) => navigate('operations', { t }, { replace: true })}
            />
          )}
          {view === 'cases' && <CasesView />}
          {view === 'lineage' && <LineageView highlight={route.params.get('src')} />}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <p className={styles.credit}>{CREDIT}</p>
          <ul className={styles.footerLinks} role="list">
            <li>
              <a href="https://github.com/divyagopalnadar/cerop-console">
                <Icon name="github" size={14} /> Source
              </a>
            </li>
            <li>
              <a href="https://divyagopalnadar.github.io/">
                <Icon name="external" size={14} /> Portfolio
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  )
}
