import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDevices } from '../App.jsx'
import SettingsModal from './SettingsModal.jsx'

const NAV_ITEMS = [
  { path: '/',         icon: '🏠', label: 'Overview' },
  { path: '/outside',  icon: '🌳', label: 'Outside'  },
  { path: '/main',     icon: '🏡', label: 'Main'     },
  { path: '/upstairs', icon: '🛏️', label: 'Upstairs' },
]

function LiveDot({ status }) {
  const cls = status === 'ok' ? 'ok' : status === 'loading' ? 'pulse' : status === 'error' ? 'error' : 'off'
  return <span className={`live-dot ${cls}`} title={status} />
}

function LastUpdated({ date }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])
  if (!date) return null
  const diff = Math.round((Date.now() - date.getTime()) / 1000)
  const label = diff < 10 ? 'just now' : diff < 60 ? `${diff}s ago` : `${Math.round(diff/60)}m ago`
  return <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)' }}>{label}</span>
}

export default function Layout({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { status, lastUpdated, refresh } = useDevices()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      {/* HEADER */}
      <header className="app-header">
        <span className="app-title">Pettigrew</span>
        <div className="header-right">
          <LastUpdated date={lastUpdated} />
          <LiveDot status={status} />
          <button className="header-icon-btn" onClick={refresh} title="Refresh now">↻</button>
          <button className="header-icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">⚙</button>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main>{children}</main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <button
            key={path}
            className={`nav-btn ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* SETTINGS */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => { setSettingsOpen(false); refresh() }}
      />
    </>
  )
}
