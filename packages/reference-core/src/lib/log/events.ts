export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface LogEntryPayload {
  level: LogLevel
  args: unknown[]
  module?: string
  timestamp?: string
  source: 'worker'
  threadId: number
}

export function isLogEntryPayload(payload: unknown): payload is LogEntryPayload {
  if (!payload || typeof payload !== 'object') return false

  const candidate = payload as Partial<LogEntryPayload>
  return (
    candidate.source === 'worker' &&
    typeof candidate.threadId === 'number' &&
    Array.isArray(candidate.args) &&
    (candidate.level === 'log' ||
      candidate.level === 'info' ||
      candidate.level === 'warn' ||
      candidate.level === 'error' ||
      candidate.level === 'debug')
  )
}

export const LOG_ENTRY_EVENT = 'log:entry' as const

export type LogEvents = {
  [LOG_ENTRY_EVENT]: LogEntryPayload
}
