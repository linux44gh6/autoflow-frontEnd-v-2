import type { AutomationConfig, AutomationLog, AutomationStatus } from './automation-types'

const API_BASE = '/api/automation'

/** Centralized boundary for the future automation backend. Mock mode deliberately performs no network calls. */
export const automationApi = {
  mode: 'mock' as const,
  endpoints: {
    start: `${API_BASE}/start`,
    stop: `${API_BASE}/stop`,
    status: `${API_BASE}/status`,
    logs: `${API_BASE}/logs`,
  },
  async start(_config: AutomationConfig): Promise<{ accepted: boolean }> {
    return { accepted: true }
  },
  async stop(): Promise<{ accepted: boolean }> {
    return { accepted: true }
  },
  async getStatus(): Promise<AutomationStatus | null> {
    return null
  },
  async getLogs(): Promise<AutomationLog[]> {
    return []
  },
}
