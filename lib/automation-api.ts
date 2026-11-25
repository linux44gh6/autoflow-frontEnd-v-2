import type {
  ApiResponse,
  AutomationConfig,
  AutomationLog,
  AutomationState,
} from './automation-types'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const AUTOMATION_BASE = `${API_ORIGIN}/api/automation`

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractErrorFromText(text: string, status: number): string {
  const preMatch = text.match(/<pre>([\s\S]*?)<\/pre>/i)
  if (preMatch) {
    const firstLine = decodeHtmlEntities(preMatch[1].split(/<br\s*\/?>|\n/i)[0] || '').trim()
    const cleaned = firstLine.replace(/^Error:\s*/i, '').trim()
    if (cleaned) return cleaned
  }

  const trimmed = text.trim()
  if (trimmed && !trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html')) {
    return trimmed
  }

  return `Request failed with status ${status}`
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  let response: Response

  try {
    response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new Error('Unable to connect to the AutoFlow backend server.')
  }

  const rawText = await response.text()
  let parsed: ApiResponse<T> | null = null

  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as ApiResponse<T>
    } catch {
      parsed = null
    }
  }

  if (!response.ok || (parsed && parsed.success === false)) {
    if (parsed) {
      const issueMessage = parsed.errors?.map((issue) => issue.message).filter(Boolean).join(', ')
      throw new Error(issueMessage || parsed.message || `Request failed with status ${response.status}`)
    }
    throw new Error(extractErrorFromText(rawText, response.status))
  }

  if (!parsed) {
    throw new Error('Unexpected non-JSON response from backend.')
  }

  return parsed
}

export const automationApi = {
  endpoints: {
    health: `${API_ORIGIN}/api/health`,
    start: `${AUTOMATION_BASE}/start`,
    stop: `${AUTOMATION_BASE}/stop`,
    status: `${AUTOMATION_BASE}/status`,
    logs: `${AUTOMATION_BASE}/logs`,
  },

  async checkHealth(): Promise<ApiResponse> {
    return requestJson(this.endpoints.health, { method: 'GET' })
  },

  async start(config: AutomationConfig): Promise<AutomationState> {
    const payload: AutomationConfig = {
      url: config.url.trim(),
      selector: config.selector.trim(),
      scrollSpeed: config.scrollSpeed,
      closeTabAfterScroll: config.closeTabAfterScroll,
    }

    const res = await requestJson<AutomationState>(this.endpoints.start, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!res.data) {
      throw new Error('Backend did not return automation state.')
    }

    return res.data
  },

  async stop(): Promise<AutomationState> {
    const res = await requestJson<AutomationState>(this.endpoints.stop, {
      method: 'POST',
    })

    if (!res.data) {
      throw new Error('Backend did not return automation state.')
    }

    return res.data
  },

  async getStatus(): Promise<AutomationState> {
    const res = await requestJson<AutomationState>(this.endpoints.status, {
      method: 'GET',
    })

    if (!res.data) {
      throw new Error('Backend did not return automation status.')
    }

    return res.data
  },

  async getLogs(): Promise<AutomationLog[]> {
    const res = await requestJson<AutomationLog[]>(this.endpoints.logs, {
      method: 'GET',
    })

    return Array.isArray(res.data) ? res.data : []
  },
}
