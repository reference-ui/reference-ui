export type LogLevel = 'log' | 'info' | 'error' | 'debug'

export interface LogEntryPayload {
  level: LogLevel
  args: unknown[]
  module?: string
  timestamp?: string
  source: 'worker'
  threadId: number
}

export type LogEvents = {
  'log:entry': LogEntryPayload
}
