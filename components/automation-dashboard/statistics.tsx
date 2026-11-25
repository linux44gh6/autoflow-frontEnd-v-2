'use client'

import { Activity, ArrowDownRight, Check, Clock3 } from 'lucide-react'
import type { AutomationStats } from '@/lib/automation-types'
import { StatCard } from './shared'

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safe / 3600)
  const mins = Math.floor((safe % 3600) / 60)
  const secs = safe % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
  }

  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
}

export function DashboardStatistics({
  stats,
  running,
}: {
  stats: AutomationStats
  running: boolean
}) {
  return (
    <section className="stats-grid" aria-label="Automation statistics">
      <StatCard
        title="Total iterations"
        value={String(stats.totalIterations)}
        detail="Completed cycles"
        icon={Activity}
      />
      <StatCard
        title="Successful tasks"
        value={String(stats.successfulTasks)}
        detail="Completed successfully"
        icon={Check}
      />
      <StatCard
        title="Failed tasks"
        value={String(stats.failedTasks)}
        detail="Needs attention"
        icon={ArrowDownRight}
      />
      <StatCard
        title="Runtime"
        value={formatDuration(stats.runtime)}
        detail={running ? 'Active run' : 'Last run'}
        icon={Clock3}
      />
    </section>
  )
}
