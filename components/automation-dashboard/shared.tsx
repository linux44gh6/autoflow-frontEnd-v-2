'use client'

import type { ReactNode } from 'react'
import { ArrowUpRight, CircleHelp, Code2 } from 'lucide-react'

export function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return <button aria-label={label} onClick={onClick} className="icon-button">{children}</button>
}

export function SectionTitle({ eyebrow, title, trailing }: { eyebrow?: string; title: string; trailing?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{trailing}</div>
}

export function StatCard({ title, value, detail, icon: Icon, trend }: { title: string; value: string; detail: string; icon: typeof ArrowUpRight; trend?: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{title}</span><span className="stat-icon"><Icon size={16} /></span></div><div className="stat-bottom"><strong>{value}</strong><span className="stat-detail">{trend && <em><ArrowUpRight size={12} />{trend}</em>}{detail}</span></div></article>
}

export function PageIntro({ onDocumentation }: { onDocumentation: () => void }) {
  return <><div className="page-heading"><div><div className="title-kicker"><span className="live-indicator" />AUTOMATION STUDIO <span className="kicker-line" /></div><h1>Browser automation</h1><p>Configure, run, and monitor your browser tasks.</p></div><button className="outline-button help-button" onClick={onDocumentation}><CircleHelp size={15} />Quick guide</button></div><div className="demo-notice"><span className="notice-icon"><Code2 size={16} /></span><p><strong>Frontend demo</strong><span>Automation controls are simulated. No browser sessions or external websites are accessed.</span></p><button onClick={onDocumentation} aria-label="Learn about demo mode"><ArrowUpRight size={14} /></button></div></>
}
