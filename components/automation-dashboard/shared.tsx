'use client'

import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

export function IconButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button aria-label={label} onClick={onClick} disabled={disabled} className="icon-button">
      {children}
    </button>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string
  title: string
  trailing?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {trailing}
    </div>
  )
}

export function StatCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: string
  detail: string
  icon: typeof ArrowUpRight
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">
          <Icon size={16} />
        </span>
      </div>
      <div className="stat-bottom">
        <strong>{value}</strong>
        <span className="stat-detail">{detail}</span>
      </div>
    </article>
  )
}

export function PageIntro() {
  return (
    <div className="page-heading">
      <div>
        <div className="title-kicker">
          <span className="live-indicator" />
          AUTOMATION STUDIO <span className="kicker-line" />
        </div>
        <h1>Browser automation</h1>
        <p>Configure, run, and monitor your browser tasks.</p>
      </div>
    </div>
  )
}
