'use client'

import { Command, LayoutDashboard, Menu, X } from 'lucide-react'
import { IconButton } from './shared'

export type BackendConnectionState = 'checking' | 'connected' | 'disconnected'

type NavigationProps = {
  sidebarOpen: boolean
  backendStatus: BackendConnectionState
  onClose: () => void
  onOpen: () => void
}

export function DashboardNavigation({
  sidebarOpen,
  backendStatus,
  onClose,
  onOpen,
}: NavigationProps) {
  const statusDotClass =
    backendStatus === 'connected'
      ? 'pulse-dot online'
      : backendStatus === 'disconnected'
        ? 'pulse-dot offline'
        : 'pulse-dot'

  const statusTitle =
    backendStatus === 'connected'
      ? 'Backend connected'
      : backendStatus === 'disconnected'
        ? 'Backend offline'
        : 'Checking backend'

  const statusSubtitle =
    backendStatus === 'connected'
      ? 'API online'
      : backendStatus === 'disconnected'
        ? 'API unreachable'
        : 'Connecting to API…'

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <Command size={19} />
          </span>
          <span>
            autoflow<span className="brand-dot">.</span>
          </span>
          <IconButton label="Close menu" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <button onClick={onClose} className="nav-item active" aria-current="page">
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="backend-status">
            <span className={statusDotClass} />
            <div>
              <strong>{statusTitle}</strong>
              <small>{statusSubtitle}</small>
            </div>
          </div>
          <div className="sidebar-footer">
            <span>
              AutoFlow <span className="muted">API</span>
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close navigation overlay"
          className="sidebar-backdrop"
          onClick={onClose}
        />
      )}

      <header className="topbar">
        <div className="topbar-left">
          <IconButton label="Open navigation" onClick={onOpen}>
            <Menu size={19} />
          </IconButton>
          <span className="crumb">Workspace</span>
          <span className="crumb-separator">/</span>
          <span className="crumb-current">Dashboard</span>
        </div>
        <div className="topbar-right">
          <span className="connection">
            <span className={statusDotClass} />
            Milon Hossain
          </span>
          <button className="avatar" aria-label="User account">
            MD
          </button>
        </div>
      </header>
    </>
  )
}
