'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Check,
  CircleHelp,
  Code2,
  ExternalLink,
  Globe2,
  MoreHorizontal,
  Play,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Terminal,
  X,
} from 'lucide-react'
import type {
  AutomationConfig,
  AutomationLog,
  AutomationStatus,
  AutomationStats,
} from '@/lib/automation-types'
import { automationApi } from '@/lib/automation-api'
import { IconButton, PageIntro, SectionTitle } from '@/components/automation-dashboard/shared'
import { DashboardStatistics } from '@/components/automation-dashboard/statistics'
import { DashboardNavigation } from '@/components/automation-dashboard/navigation'

type HistoryItem = {
  url: string
  date: string
  duration: string
  iterations: number
  status: 'Completed' | 'Stopped' | 'Error'
}

const initialHistory: HistoryItem[] = [
  { url: 'https://docs.stripe.com', date: 'Today, 10:42 AM', duration: '02m 14s', iterations: 12, status: 'Completed' },
  { url: 'https://vercel.com/changelog', date: 'Today, 09:18 AM', duration: '01m 06s', iterations: 6, status: 'Stopped' },
  { url: 'https://developer.mozilla.org', date: 'Yesterday, 04:32 PM', duration: '04m 51s', iterations: 24, status: 'Completed' },
]

const initialLogs: AutomationLog[] = [
  { id: 'a', timestamp: '21:30:01', message: '[Sample] Automation started.', level: 'success' },
  { id: 'b', timestamp: '21:30:02', message: 'Opening website…', level: 'info' },
  { id: 'c', timestamp: '21:30:04', message: 'Website loaded successfully.', level: 'success' },
  { id: 'd', timestamp: '21:30:05', message: 'Clicking target link.', level: 'info' },
  { id: 'e', timestamp: '21:30:06', message: 'New tab opened.', level: 'success' },
  { id: 'f', timestamp: '21:30:08', message: 'Scrolling page…', level: 'info' },
  { id: 'g', timestamp: '21:30:15', message: 'Scroll completed.', level: 'success' },
  { id: 'h', timestamp: '21:30:16', message: 'Waiting for next iteration.', level: 'warning' },
]

const defaultConfig: AutomationConfig = {
  url: '',
  selector: '',
  intervalSeconds: 10,
  actionsPerMinute: 6,
  scrollSpeed: 'Normal',
  scrollDelay: 3,
  maxIterations: null,
  openInNewTab: true,
  closeTabAfterScroll: false,
}

export function AutomationDashboard() {
  const [config, setConfig] = useState(defaultConfig)
  const [status, setStatus] = useState<AutomationStatus>({
    state: 'Idle',
    currentUrl: '—',
    iteration: 0,
    completedIterations: 0,
    successfulNavigations: 0,
    failedNavigations: 0,
    currentAction: 'Ready to start',
  })
  const [stats, setStats] = useState<AutomationStats>({
    totalIterations: 0,
    successfulTasks: 0,
    failedTasks: 0,
    runtimeSeconds: 0,
  })
  const [logs, setLogs] = useState<AutomationLog[]>(initialLogs)
  const [history, setHistory] = useState(initialHistory)
  const [confirmStart, setConfirmStart] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [urlError, setUrlError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const running = status.state === 'Running'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(
      () => setStats((s) => ({ ...s, runtimeSeconds: s.runtimeSeconds + 1 })),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [running])

  function addLog(message: string, level: AutomationLog['level'] = 'info') {
    setLogs((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message,
        level,
      },
    ])
  }

  async function startAutomation() {
    let parsed: URL
    try {
      parsed = new URL(config.url)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
    } catch {
      setUrlError('Enter a valid website URL beginning with https://')
      setConfirmStart(false)
      return
    }

    setUrlError('')
    setConfirmStart(false)
    await automationApi.start(config)
    setStatus((current) => ({
      ...current,
      state: 'Running',
      currentUrl: parsed.toString(),
      currentAction: 'Opening page',
    }))
    setStats((s) => ({ ...s, runtimeSeconds: 0 }))
    addLog(`Demo run started for ${parsed.hostname}.`, 'success')
    addLog('Mock mode: no browser is launched and no website is accessed.', 'warning')
    addLog('Waiting for next iteration.', 'info')
  }

  async function stopAutomation() {
    await automationApi.stop()
    setStatus((s) => ({ ...s, state: 'Stopping', currentAction: 'Stopping demo run' }))
    addLog('Stop requested. Ending mock run…', 'warning')
    window.setTimeout(() => {
      setStatus((s) => ({ ...s, state: 'Completed', currentAction: 'Run stopped' }))
      addLog('Demo run stopped.', 'success')
      setHistory((h) =>
        [
          {
            url: config.url,
            date: 'Just now',
            duration: formatDuration(stats.runtimeSeconds),
            iterations: stats.totalIterations,
            status: 'Stopped' as const,
          },
          ...h,
        ].slice(0, 4),
      )
    }, 500)
  }

  function changeConfig<K extends keyof AutomationConfig>(key: K, value: AutomationConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="app-shell">
      <DashboardNavigation
        sidebarOpen={sidebarOpen}
        activeNav={activeNav}
        onSelect={setActiveNav}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      <main className="main-area">
        <div className="content">
          <PageIntro onDocumentation={() => setActiveNav('Documentation')} />
          <DashboardStatistics stats={stats} running={running} />

          <div className="dashboard-grid">
            <section className="panel config-panel">
              <SectionTitle
                eyebrow="SETUP"
                title="Automation configuration"
                trailing={
                  <span className="step-chip">
                    <span>01</span> Configure
                  </span>
                }
              />
              <div className="form-stack">
                <label className="field">
                  <span>
                    Website URL <b className="required">*</b>
                  </span>
                  <div className={`input-wrap ${urlError ? 'input-error' : ''}`}>
                    <Globe2 size={16} />
                    <input
                      aria-label="Website URL"
                      type="url"
                      value={config.url}
                      onChange={(e) => {
                        changeConfig('url', e.target.value)
                        setUrlError('')
                      }}
                      placeholder="https://example.com"
                      aria-invalid={Boolean(urlError)}
                    />
                  </div>
                  {urlError && <small className="error-text">{urlError}</small>}
                </label>

                <label className="field">
                  <span>
                    Link selector <small>OPTIONAL</small>
                  </span>
                  <div className="input-wrap">
                    <Code2 size={16} />
                    <input
                      aria-label="Link selector"
                      value={config.selector}
                      onChange={(e) => changeConfig('selector', e.target.value)}
                      placeholder="a.visit-link"
                    />
                  </div>
                  <small className="field-help">CSS selector for links to interact with.</small>
                </label>

                <div className="form-divider" />

                <div className="subsection-title">
                  <SlidersHorizontal size={15} />
                  <span>Run settings</span>
                </div>

                <div className="settings-grid">
                  <label className="field">
                    <span>Click interval</span>
                    <div className="number-wrap">
                      <input
                        aria-label="Click interval in seconds"
                        type="number"
                        min="1"
                        max="300"
                        value={config.intervalSeconds}
                        onChange={(e) => changeConfig('intervalSeconds', Number(e.target.value))}
                      />
                      <span>sec</span>
                    </div>
                  </label>

                  <label className="field">
                    <span>Actions per minute</span>
                    <select
                      aria-label="Actions per minute"
                      value={config.actionsPerMinute}
                      onChange={(e) => changeConfig('actionsPerMinute', Number(e.target.value))}
                    >
                      <option value={5}>5 actions</option>
                      <option value={6}>6 actions</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Scroll speed</span>
                    <select
                      aria-label="Scroll speed"
                      value={config.scrollSpeed}
                      onChange={(e) =>
                        changeConfig('scrollSpeed', e.target.value as AutomationConfig['scrollSpeed'])
                      }
                    >
                      <option>Slow</option>
                      <option>Normal</option>
                      <option>Fast</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Scroll delay</span>
                    <div className="number-wrap">
                      <input
                        aria-label="Scroll delay in seconds"
                        type="number"
                        min="0"
                        max="60"
                        value={config.scrollDelay}
                        onChange={(e) => changeConfig('scrollDelay', Number(e.target.value))}
                      />
                      <span>sec</span>
                    </div>
                  </label>

                  <label className="field">
                    <span>Maximum iterations</span>
                    <div className="number-wrap">
                      <input
                        aria-label="Maximum iterations"
                        type="number"
                        min="1"
                        max="10000"
                        placeholder="Unlimited"
                        value={config.maxIterations ?? ''}
                        onChange={(e) =>
                          changeConfig(
                            'maxIterations',
                            e.target.value
                              ? Math.min(10000, Math.max(1, Number(e.target.value)))
                              : null,
                          )
                        }
                      />
                      <span>runs</span>
                    </div>
                  </label>

                  <label className="field">
                    <span>Open links in</span>
                    <select
                      aria-label="Open links in"
                      value={config.openInNewTab ? 'new' : 'same'}
                      onChange={(e) => changeConfig('openInNewTab', e.target.value === 'new')}
                    >
                      <option value="new">New tab</option>
                      <option value="same">Same tab</option>
                    </select>
                  </label>
                </div>

                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={config.closeTabAfterScroll}
                    onChange={(e) => changeConfig('closeTabAfterScroll', e.target.checked)}
                  />
                  <span className="check-box">
                    <Check size={13} />
                  </span>
                  <span>Close tab after scrolling</span>
                  <small>Closes each opened tab after the scroll action.</small>
                </label>

                <div className="button-row">
                  <button
                    className="start-button"
                    disabled={running || status.state === 'Stopping'}
                    onClick={() => setConfirmStart(true)}
                  >
                    <Play size={15} fill="currentColor" />
                    {running ? 'Automation running' : 'Start automation'}
                    <span className="button-shortcut">⌘ ↵</span>
                  </button>
                  <button className="stop-button" disabled={!running} onClick={stopAutomation}>
                    <Square size={14} fill="currentColor" />
                    Stop
                  </button>
                </div>

                <p className="api-footnote">
                  <ShieldCheck size={13} /> Settings are kept in this session only.
                </p>
              </div>
            </section>

            <div className="right-column">
              <section className="panel status-panel">
                <SectionTitle
                  eyebrow="LIVE MONITOR"
                  title="Run status"
                  trailing={
                    <span className={`status-pill ${status.state.toLowerCase()}`}>
                      <span />
                      {status.state}
                    </span>
                  }
                />

                <div className="current-url">
                  <span className="url-icon">
                    <Globe2 size={15} />
                  </span>
                  <span>
                    <small>CURRENT URL</small>
                    <strong>{status.currentUrl}</strong>
                  </span>
                  <button aria-label="Open current URL" disabled={status.currentUrl === '—'}>
                    <ExternalLink size={14} />
                  </button>
                </div>

                <div className="status-metrics">
                  <div>
                    <small>Current iteration</small>
                    <strong>
                      {String(status.iteration).padStart(2, '0')}
                      <i> / {config.maxIterations ?? '∞'}</i>
                    </strong>
                  </div>
                  <div>
                    <small>Completed</small>
                    <strong>{String(status.completedIterations).padStart(2, '0')}</strong>
                  </div>
                  <div>
                    <small>Navigation</small>
                    <strong className="nav-success">
                      {status.successfulNavigations}
                      <i> / </i>
                      <span className="nav-failed">{status.failedNavigations}</span>
                    </strong>
                  </div>
                </div>

                <div className="action-line">
                  <span className="action-symbol">
                    <Activity size={15} />
                  </span>
                  <span>
                    <small>CURRENT ACTION</small>
                    <strong>{status.currentAction}</strong>
                  </span>
                  <span className="action-time">
                    <span className={running ? 'pulse-dot' : 'idle-dot'} />
                    {running ? 'Live' : 'Idle'}
                  </span>
                </div>
              </section>

              <section className="panel logs-panel">
                <SectionTitle
                  eyebrow="EXECUTION STREAM"
                  title="Activity logs"
                  trailing={
                    <div className="log-actions">
                      <span className="log-count">{logs.length} events</span>
                      <IconButton label="Clear activity logs" onClick={() => setLogs([])}>
                        <X size={15} />
                      </IconButton>
                    </div>
                  }
                />

                <div className="terminal-bar">
                  <span>
                    <Terminal size={13} /> SESSION OUTPUT
                  </span>
                  <span className="terminal-live">
                    <span className="idle-dot" />
                    MOCK DATA
                  </span>
                </div>

                <div className="log-list" aria-live="polite" aria-label="Automation activity log">
                  {logs.length ? (
                    logs.map((log) => (
                      <div className={`log-row ${log.level}`} key={log.id}>
                        <span className="log-dot" />
                        <time>{log.timestamp}</time>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="logs-empty">No events yet. Start a demo run to see activity.</div>
                  )}
                  <div ref={endRef} />
                </div>

                <div className="log-footer">
                  <span>
                    <span className="pulse-dot" />
                    Following latest
                  </span>
                  <span>
                    UTF-8 <span className="footer-divider">·</span> Local session
                  </span>
                </div>
              </section>
            </div>
          </div>

          <section className="panel history-panel">
            <SectionTitle
              eyebrow="RECENT ACTIVITY"
              title="Automation history"
              trailing={
                <button className="text-button" onClick={() => setActiveNav('Automation history')}>
                  View all <ArrowUpRight size={14} />
                </button>
              }
            />

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>WEBSITE URL</th>
                    <th>STARTED AT</th>
                    <th>DURATION</th>
                    <th>ITERATIONS</th>
                    <th>STATUS</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={`${item.url}-${index}`}>
                      <td>
                        <span className="site-cell">
                          <span className="site-favicon">
                            <Globe2 size={14} />
                          </span>
                          <span>{item.url}</span>
                        </span>
                      </td>
                      <td>{item.date}</td>
                      <td>{item.duration}</td>
                      <td>{item.iterations}</td>
                      <td>
                        <span className={`history-status ${item.status.toLowerCase()}`}>
                          <span />
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button className="row-action" aria-label={`More actions for ${item.url}`}>
                          <MoreHorizontal size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="history-foot">
              <span>
                Showing <strong>{history.length}</strong> recent runs
              </span>
              <button onClick={() => setHistory(initialHistory)}>
                Reset demo data <ArrowUpRight size={13} />
              </button>
            </div>
          </section>

          <footer className="page-footer">
            <span>
              <span className="footer-brand">
                autoflow<span className="brand-dot">.</span>
              </span>{' '}
              Browser automation, made observable.
            </span>
            <span>Demo UI · API integration ready</span>
          </footer>
        </div>
      </main>

      {confirmStart && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmStart(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="confirm-dialog"
          >
            <div className="dialog-icon">
              <Radio size={19} />
            </div>
            <button
              className="dialog-close"
              aria-label="Close confirmation"
              onClick={() => setConfirmStart(false)}
            >
              <X size={17} />
            </button>
            <p className="eyebrow">START DEMO RUN</p>
            <h2 id="confirm-title">Ready to start?</h2>
            <p className="dialog-description">
              This is a frontend-only simulation. It will not open a browser or visit{' '}
              <strong>{config.url || 'your target URL'}</strong>.
            </p>
            <div className="dialog-meta">
              <span>Run target</span>
              <strong>{config.url || 'No URL entered'}</strong>
              <span>Mode</span>
              <strong>
                <span className="idle-dot" /> Simulated
              </strong>
            </div>
            <div className="dialog-actions">
              <button className="outline-button" onClick={() => setConfirmStart(false)}>
                Cancel
              </button>
              <button className="start-button" onClick={startAutomation}>
                <Play size={14} fill="currentColor" />
                Start demo
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s`
}