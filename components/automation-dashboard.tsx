'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Check,
  Code2,
  ExternalLink,
  Globe2,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Terminal,
  X,
} from 'lucide-react'
import type {
  AutomationAction,
  AutomationConfig,
  AutomationLog,
  AutomationRunStatus,
  AutomationState,
  ScrollSpeed,
} from '@/lib/automation-types'
import { automationApi } from '@/lib/automation-api'
import { IconButton, PageIntro, SectionTitle } from '@/components/automation-dashboard/shared'
import { DashboardStatistics } from '@/components/automation-dashboard/statistics'
import {
  DashboardNavigation,
  type BackendConnectionState,
} from '@/components/automation-dashboard/navigation'

const defaultConfig: AutomationConfig = {
  url: '',
  selector: 'a',
  scrollSpeed: 'normal',
  closeTabAfterScroll: true,
}

const initialAutomationState: AutomationState = {
  status: 'idle',
  currentUrl: null,
  currentAction: null,
  startedAt: null,
  stats: {
    totalIterations: 0,
    successfulTasks: 0,
    failedTasks: 0,
    runtime: 0,
  },
  logs: [],
}

const STATUS_LABELS: Record<AutomationRunStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  stopping: 'Stopping',
  completed: 'Completed',
  error: 'Error',
}

const ACTION_LABELS: Record<AutomationAction, string> = {
  opening_page: 'Opening browser tabs',
  clicking_link: 'Clicking target link',
  scrolling: 'Scrolling page',
  waiting: 'Waiting for next cycle',
  completed: 'Automation completed',
  error: 'Error occurred',
}

function formatLogTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  if (Number.isNaN(date.getTime())) return isoTimestamp
  return date.toLocaleTimeString('en-US', { hour12: false })
}

export function AutomationDashboard() {
  const [config, setConfig] = useState<AutomationConfig>(defaultConfig)
  const [automationState, setAutomationState] = useState<AutomationState>(initialAutomationState)
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [backendStatus, setBackendStatus] = useState<BackendConnectionState>('checking')
  const [apiError, setApiError] = useState('')
  const [urlError, setUrlError] = useState('')
  const [selectorError, setSelectorError] = useState('')
  const [confirmStart, setConfirmStart] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false)

  const endRef = useRef<HTMLDivElement>(null)
  const pollingInFlightRef = useRef(false)

  const running = automationState.status === 'running'
  const stopping = automationState.status === 'stopping' || isStopping
  const isActive = running || automationState.status === 'stopping'

  const syncFromBackend = useCallback(async (includeHealth = false) => {
    if (pollingInFlightRef.current) return
    pollingInFlightRef.current = true

    try {
      if (includeHealth) {
        await automationApi.checkHealth()
      }

      const [nextStatus, nextLogs] = await Promise.all([
        automationApi.getStatus(),
        automationApi.getLogs(),
      ])

      setBackendStatus('connected')
      setAutomationState(nextStatus)
      setLogs(nextLogs)
    } catch {
      setBackendStatus('disconnected')
    } finally {
      pollingInFlightRef.current = false
    }
  }, [])

  // Initial load: check /api/health and hydrate current status & logs
  useEffect(() => {
    void syncFromBackend(true)
  }, [syncFromBackend])

  // Poll backend: fast (1.5s) while running/stopping, slower (5s) when idle
  useEffect(() => {
    const intervalMs = isActive ? 1500 : 5000
    const timer = window.setInterval(() => {
      void syncFromBackend(!isActive)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [isActive, syncFromBackend])

  // Smooth 1-second runtime increment between polls while running
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setAutomationState((current) => ({
        ...current,
        stats: {
          ...current.stats,
          runtime: current.stats.runtime + 1,
        },
      }))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  function changeConfig<K extends keyof AutomationConfig>(key: K, value: AutomationConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  function validateForm(): boolean {
    let valid = true

    try {
      const parsed = new URL(config.url.trim())
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('Only HTTP and HTTPS URLs are allowed.')
        valid = false
      } else if (parsed.username || parsed.password) {
        setUrlError('URLs containing credentials are not allowed.')
        valid = false
      } else {
        setUrlError('')
      }
    } catch {
      setUrlError('Enter a valid website URL beginning with https:// or http://')
      valid = false
    }

    const trimmedSelector = config.selector.trim()
    if (!trimmedSelector) {
      setSelectorError('CSS selector is required by the backend.')
      valid = false
    } else if (trimmedSelector.length > 500) {
      setSelectorError('CSS selector must be 500 characters or fewer.')
      valid = false
    } else {
      setSelectorError('')
    }

    return valid
  }

  const handleOpenConfirm = useCallback(() => {
    if (isActive || isStarting || stopping) return
    setApiError('')
    if (!validateForm()) return
    setConfirmStart(true)
  }, [config.selector, config.url, isActive, isStarting, stopping])

  // Cmd/Ctrl + Enter shortcut to start automation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleOpenConfirm()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleOpenConfirm])

  async function startAutomation() {
    if (!validateForm()) {
      setConfirmStart(false)
      return
    }

    setConfirmStart(false)
    setApiError('')
    setIsStarting(true)

    try {
      const nextState = await automationApi.start(config)
      setBackendStatus('connected')
      setAutomationState(nextState)
      setLogs(nextState.logs)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start automation.'
      setApiError(message)
      if (message.includes('Unable to connect')) {
        setBackendStatus('disconnected')
      }
    } finally {
      setIsStarting(false)
    }
  }

  async function stopAutomation() {
    setApiError('')
    setIsStopping(true)
    setAutomationState((current) => ({ ...current, status: 'stopping' }))

    try {
      const nextState = await automationApi.stop()
      setBackendStatus('connected')
      setAutomationState(nextState)
      setLogs(nextState.logs)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop automation.'
      setApiError(message)
      await syncFromBackend(true)
    } finally {
      setIsStopping(false)
    }
  }

  async function refreshLogs() {
    setIsRefreshingLogs(true)
    try {
      const nextLogs = await automationApi.getLogs()
      setLogs(nextLogs)
      setBackendStatus('connected')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch logs.'
      setApiError(message)
      setBackendStatus('disconnected')
    } finally {
      setIsRefreshingLogs(false)
    }
  }

  const currentActionLabel = automationState.currentAction
    ? ACTION_LABELS[automationState.currentAction]
    : stopping
      ? 'Stopping automation…'
      : 'Ready to start'

  const statusLabel = STATUS_LABELS[automationState.status]

  return (
    <div className="app-shell">
      <DashboardNavigation
        sidebarOpen={sidebarOpen}
        backendStatus={backendStatus}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      <main className="main-area">
        <div className="content">
          <PageIntro />

          {backendStatus === 'disconnected' && (
            <div className="api-error-banner" role="alert">
              <span className="api-error-icon">
                <AlertCircle size={16} />
              </span>
              <p>
                <strong>Backend server unreachable</strong>
                <span>
                  Make sure the AutoFlow backend is running on port 5000 (or set{' '}
                  <code>BACKEND_URL</code>).
                </span>
              </p>
              <button
                className="outline-button"
                onClick={() => void syncFromBackend(true)}
              >
                Retry
              </button>
            </div>
          )}

          {apiError && (
            <div className="api-error-banner" role="alert">
              <span className="api-error-icon">
                <AlertCircle size={16} />
              </span>
              <p>
                <strong>API error</strong>
                <span>{apiError}</span>
              </p>
              <IconButton label="Dismiss error" onClick={() => setApiError('')}>
                <X size={15} />
              </IconButton>
            </div>
          )}

          <DashboardStatistics stats={automationState.stats} running={running} />

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
                      disabled={isActive || isStarting}
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
                    CSS selector <b className="required">*</b>
                  </span>
                  <div className={`input-wrap ${selectorError ? 'input-error' : ''}`}>
                    <Code2 size={16} />
                    <input
                      aria-label="CSS selector"
                      disabled={isActive || isStarting}
                      value={config.selector}
                      onChange={(e) => {
                        changeConfig('selector', e.target.value)
                        setSelectorError('')
                      }}
                      placeholder="a.visit-link"
                      aria-invalid={Boolean(selectorError)}
                    />
                  </div>
                  {selectorError ? (
                    <small className="error-text">{selectorError}</small>
                  ) : (
                    <small className="field-help">
                      Required by backend validation (1–500 characters).
                    </small>
                  )}
                </label>

                <div className="form-divider" />

                <div className="subsection-title">
                  <SlidersHorizontal size={15} />
                  <span>Run settings</span>
                </div>

                <label className="field">
                  <span>Scroll speed</span>
                  <select
                    aria-label="Scroll speed"
                    disabled={isActive || isStarting}
                    value={config.scrollSpeed}
                    onChange={(e) => changeConfig('scrollSpeed', e.target.value as ScrollSpeed)}
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </label>

                <label className="check-row">
                  <input
                    type="checkbox"
                    disabled={isActive || isStarting}
                    checked={config.closeTabAfterScroll}
                    onChange={(e) => changeConfig('closeTabAfterScroll', e.target.checked)}
                  />
                  <span className="check-box">
                    <Check size={13} />
                  </span>
                  <span>Close tab after scrolling</span>
                  <small>Closes opened browser tabs after each cycle.</small>
                </label>

                <div className="button-row">
                  <button
                    className="start-button"
                    disabled={isActive || isStarting || stopping || backendStatus === 'disconnected'}
                    onClick={handleOpenConfirm}
                  >
                    <Play size={15} fill="currentColor" />
                    {isStarting
                      ? 'Starting…'
                      : running
                        ? 'Automation running'
                        : stopping
                          ? 'Stopping…'
                          : 'Start automation'}
                    <span className="button-shortcut">⌘ ↵</span>
                  </button>
                  <button
                    className="stop-button"
                    disabled={!running || stopping}
                    onClick={stopAutomation}
                  >
                    <Square size={14} fill="currentColor" />
                    {stopping ? 'Stopping' : 'Stop'}
                  </button>
                </div>

                <p className="api-footnote">
                  <ShieldCheck size={13} /> Runs continuously via Playwright backend until stopped.
                </p>
              </div>
            </section>

            <div className="right-column">
              <section className="panel status-panel">
                <SectionTitle
                  eyebrow="LIVE MONITOR"
                  title="Run status"
                  trailing={
                    <span className={`status-pill ${automationState.status}`}>
                      <span />
                      {statusLabel}
                    </span>
                  }
                />

                <div className="current-url">
                  <span className="url-icon">
                    <Globe2 size={15} />
                  </span>
                  <span>
                    <small>CURRENT URL</small>
                    <strong>{automationState.currentUrl || '—'}</strong>
                  </span>
                  <button
                    aria-label="Open current URL"
                    disabled={!automationState.currentUrl}
                    onClick={() => {
                      if (automationState.currentUrl) {
                        window.open(automationState.currentUrl, '_blank', 'noopener,noreferrer')
                      }
                    }}
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>

                <div className="status-metrics">
                  <div>
                    <small>Total cycles</small>
                    <strong>
                      {String(automationState.stats.totalIterations).padStart(2, '0')}
                    </strong>
                  </div>
                  <div>
                    <small>Successful</small>
                    <strong className="nav-success">
                      {String(automationState.stats.successfulTasks).padStart(2, '0')}
                    </strong>
                  </div>
                  <div>
                    <small>Failed</small>
                    <strong className={automationState.stats.failedTasks > 0 ? 'nav-failed' : ''}>
                      {String(automationState.stats.failedTasks).padStart(2, '0')}
                    </strong>
                  </div>
                </div>

                <div className="action-line">
                  <span className="action-symbol">
                    <Activity size={15} />
                  </span>
                  <span>
                    <small>CURRENT ACTION</small>
                    <strong>{currentActionLabel}</strong>
                  </span>
                  <span className="action-time">
                    <span
                      className={
                        running
                          ? 'pulse-dot online'
                          : stopping
                            ? 'pulse-dot'
                            : 'idle-dot'
                      }
                    />
                    {running ? 'Live' : statusLabel}
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
                      <IconButton
                        label="Refresh activity logs"
                        disabled={isRefreshingLogs}
                        onClick={() => void refreshLogs()}
                      >
                        <RefreshCw size={14} className={isRefreshingLogs ? 'animate-spin' : ''} />
                      </IconButton>
                    </div>
                  }
                />

                <div className="terminal-bar">
                  <span>
                    <Terminal size={13} /> SESSION OUTPUT
                  </span>
                  <span
                    className={`terminal-live ${
                      backendStatus === 'connected'
                        ? 'online'
                        : backendStatus === 'disconnected'
                          ? 'offline'
                          : ''
                    }`}
                  >
                    <span
                      className={
                        running
                          ? 'pulse-dot online'
                          : backendStatus === 'connected'
                            ? 'pulse-dot online'
                            : backendStatus === 'disconnected'
                              ? 'pulse-dot offline'
                              : 'idle-dot'
                      }
                    />
                    {running
                      ? 'LIVE STREAM'
                      : backendStatus === 'connected'
                        ? 'API CONNECTED'
                        : backendStatus === 'disconnected'
                          ? 'OFFLINE'
                          : 'CONNECTING'}
                  </span>
                </div>

                <div className="log-list" aria-live="polite" aria-label="Automation activity log">
                  {logs.length ? (
                    logs.map((log, index) => (
                      <div className={`log-row ${log.type}`} key={`${log.timestamp}-${index}`}>
                        <span className="log-dot" />
                        <time>{formatLogTime(log.timestamp)}</time>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="logs-empty">
                      No events yet. Start an automation run to see live backend logs.
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                <div className="log-footer">
                  <span>
                    <span className={running ? 'pulse-dot online' : 'idle-dot'} />
                    {running ? 'Following latest (1.5s)' : 'Synced with backend'}
                  </span>
                  <span>
                    UTF-8 <span className="footer-divider">·</span> AutoFlow API
                  </span>
                </div>
              </section>
            </div>
          </div>

          <footer className="page-footer">
            <span>
              <span className="footer-brand">
                autoflow<span className="brand-dot">.</span>
              </span>{' '}
              Browser automation, made observable.
            </span>
            <span>
              {backendStatus === 'connected'
                ? 'Live API connected'
                : backendStatus === 'disconnected'
                  ? 'Backend disconnected'
                  : 'Connecting to backend…'}
            </span>
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
            <p className="eyebrow">START AUTOMATION</p>
            <h2 id="confirm-title">Ready to start?</h2>
            <p className="dialog-description">
              This will launch Chromium on the backend and run continuous tab cycles for{' '}
              <strong>{config.url.trim()}</strong> until you stop it.
            </p>
            <div className="dialog-meta">
              <span>Target URL</span>
              <strong>{config.url.trim()}</strong>
              <span>Selector</span>
              <strong>{config.selector.trim()}</strong>
              <span>Scroll speed</span>
              <strong style={{ textTransform: 'capitalize' }}>{config.scrollSpeed}</strong>
            </div>
            <div className="dialog-actions">
              <button className="outline-button" onClick={() => setConfirmStart(false)}>
                Cancel
              </button>
              <button className="start-button" onClick={startAutomation}>
                <Play size={14} fill="currentColor" />
                Start automation
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
