'use client'

import { BookOpen, ChevronDown, CircleHelp, Command, FileClock, LayoutDashboard, Menu, MoreHorizontal, Settings2, X } from 'lucide-react'
import { IconButton } from './shared'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Automation history', icon: FileClock },
  { label: 'Settings', icon: Settings2 },
  { label: 'Documentation', icon: BookOpen },
]

type NavigationProps = {
  sidebarOpen: boolean
  activeNav: string
  onSelect: (label: string) => void
  onClose: () => void
  onOpen: () => void
}

export function DashboardNavigation({ sidebarOpen, activeNav, onSelect, onClose, onOpen }: NavigationProps) {
  return <><aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
    <div className="brand"><span className="brand-mark"><Command size={19} /></span><span>autoflow<span className="brand-dot">.</span></span><IconButton label="Close menu" onClick={onClose}><X size={17} /></IconButton></div>
    <div className="workspace-switch"><span className="workspace-avatar">A</span><span className="workspace-copy"><strong>Acme workspace</strong><small>Free plan</small></span><ChevronDown size={15} /></div>
    <p className="nav-label">WORKSPACE</p>
    <nav aria-label="Main navigation">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { onSelect(label); onClose() }} className={`nav-item ${activeNav === label ? 'active' : ''}`}><Icon size={17} /><span>{label}</span>{label === 'Automation history' && <span className="nav-count">3</span>}</button>)}</nav>
    <div className="sidebar-bottom"><div className="backend-status"><span className="pulse-dot" /><div><strong>Demo environment</strong><small>API not connected</small></div><CircleHelp size={15} /></div><div className="sidebar-footer"><span>AutoFlow <span className="muted">v0.8.2</span></span><IconButton label="More options"><MoreHorizontal size={17} /></IconButton></div></div>
  </aside>{sidebarOpen && <button aria-label="Close navigation overlay" className="sidebar-backdrop" onClick={onClose} />}<header className="topbar"><div className="topbar-left"><IconButton label="Open navigation" onClick={onOpen}><Menu size={19} /></IconButton><span className="crumb">Workspace</span><span className="crumb-separator">/</span><span className="crumb-current">Dashboard</span></div><div className="topbar-right"><span className="connection"><span className="pulse-dot" />Demo mode</span><button className="avatar" aria-label="User account">JD</button></div></header></>
}
