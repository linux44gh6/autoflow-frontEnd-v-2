export type ScrollSpeed = 'slow' | 'normal' | 'fast'

export interface AutomationConfig {
  url: string
  selector: string
  scrollSpeed: ScrollSpeed
  closeTabAfterScroll: boolean
}

export type AutomationRunStatus = 'idle' | 'running' | 'stopping' | 'completed' | 'error'

export type AutomationAction =
  | 'opening_page'
  | 'clicking_link'
  | 'scrolling'
  | 'waiting'
  | 'completed'
  | 'error'

export interface AutomationLog {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface AutomationStats {
  totalIterations: number
  successfulTasks: number
  failedTasks: number
  runtime: number
}

export interface AutomationState {
  status: AutomationRunStatus
  currentUrl: string | null
  currentAction: AutomationAction | null
  startedAt: number | null
  stats: AutomationStats
  logs: AutomationLog[]
}

export interface ApiResponse<T = undefined> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{
    path?: Array<string | number>
    message: string
  }>
}
