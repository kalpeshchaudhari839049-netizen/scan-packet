import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { useLanguage } from './language/useLanguage.js'

const UploadPage = lazy(() => import('./pages/UploadPage.jsx'))
const ResultPage = lazy(() => import('./pages/ResultPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const RulesPage = lazy(() => import('./pages/RulesPage.jsx'))
const DemoPage = lazy(() => import('./pages/DemoPage.jsx'))

const NAV = [
  { to: '/',          icon: '⬆',  key: 'upload' },
  { to: '/dashboard', icon: '📊', key: 'dashboard' },
  { to: '/rules',     icon: '📋', key: 'rules' },
  { to: '/demo',      icon: '🎯', key: 'demo' },
]

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ca-theme') || 'dark')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ca-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="app-navigation">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon">🛡</div>
            <span className="brand-name">Code Alpha</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge-pill">AI Compliance</span>
            <span className="badge-pill sih-badge">SIH 2026</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Navigation</span>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{n.icon}</span>
              {t(n.key)}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--line)' }}>
          <div className="text-xs text-muted" style={{ marginBottom: 8 }}>
            Legal Metrology Act 2009<br/>
            FSSAI Regulations 2020
          </div>
          <div className="text-xs text-muted">v1.0.0 · Built for SIH 2026</div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon mobile-menu-toggle"
            type="button"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={sidebarOpen}
            aria-controls="app-navigation"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="team-header-pill">CODE ALPHA <span>·</span> SIH 2026</div>
          <div style={{ flex: 1 }} />
          <div className="language-toggle" role="group" aria-label={t('languages')}>
            {[['en', 'EN'], ['hi', 'हिं'], ['mr', 'मरा']].map(([key, label]) => (
              <button key={key} className={`btn btn-ghost btn-sm ${language === key ? 'active' : ''}`} type="button" onClick={() => setLanguage(key)} aria-pressed={language === key} aria-label={`${t('languages')}: ${label}`}>{label}</button>
            ))}
          </div>
          <span className="api-status online" role="status"><span className="api-status-dot" />On-device mode</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        {/* Pages */}
        {sidebarOpen && (
          <button
            className="sidebar-backdrop"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="page-content">
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="spinner spinner-lg" /></div>}>
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/result/:id" element={<ResultPage key={location.pathname} />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/demo" element={<DemoPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
