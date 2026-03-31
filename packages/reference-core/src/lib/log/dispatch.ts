import { isMainThread } from 'node:worker_threads'
import { forwardWorkerLog } from './relay'
import { writeLogEntry } from './console-write'
import type { LogLevel } from './events'

export function dispatchLogEntry(entry: {
  level: LogLevel
  args: unknown[]
  module?: string
  timestamp?: string
}): void {
  if (isMainThread) {
    writeLogEntry(entry.level, entry.args, {
      module: entry.module,
      timestamp: entry.timestamp,
    })
    return
  }

  forwardWorkerLog(entry)
}
