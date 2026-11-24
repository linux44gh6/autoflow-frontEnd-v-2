export interface AutomationConfig {
  url: string
  selector: string
  intervalSeconds: number
  actionsPerMinute: number
  scrollSpeed: 'Slow' | 'Normal' | 'Fast'
  scrollDelay: number
  maxIterations: number | null
  openInNewTab: boolean
  closeTabAfterScroll: boolean
}

export interface AutomationStatus {
  state: 'Idle' | 'Running' | 'Stopping' | 'Completed' | 'Error'
  currentUrl: string
  iteration: number
  completedIterations: number
  successfulNavigations: number
  failedNavigations: number
  currentAction: string
}

export interface AutomationLog {
  id: string
  timestamp: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
}

export interface AutomationStats {
  totalIterations: number
  successfulTasks: number
  failedTasks: number
  runtimeSeconds: number
}
