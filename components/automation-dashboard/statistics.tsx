'use client'

import { Activity, ArrowDownRight, ArrowUpRight, Check, Clock3 } from 'lucide-react'
import type { AutomationStats } from '@/lib/automation-types'
import { StatCard } from './shared'

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s`
}

export function DashboardStatistics({ stats, running }: { stats: AutomationStats; running: boolean }) {
  return <section className="stats-grid" aria-label="Automation statistics"><StatCard title="Total iterations" value={String(stats.totalIterations)} detail="Across all runs" icon={Activity} /><StatCard title="Successful tasks" value={String(stats.successfulTasks)} detail="Completed successfully" icon={Check} trend={stats.successfulTasks ? '+1' : undefined} /><StatCard title="Failed tasks" value={String(stats.failedTasks)} detail="Needs attention" icon={ArrowDownRight} /><StatCard title="Runtime" value={formatDuration(stats.runtimeSeconds)} detail={running ? 'Current session' : 'This session'} icon={Clock3} /></section>
}
