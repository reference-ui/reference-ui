import { getConfig } from '../../config/store'
import { timestamp, warnRefSync } from './console-write'
import { dispatchLogEntry } from './dispatch'
import { closeLogRelay, initLogRelay } from './relay'

type LogFn = (...args: unknown[]) => void
type LogDebugFn = (module: string, ...args: unknown[]) => void

type Log = LogFn & {
  error: LogFn
  info: LogFn
  warn: LogFn
  debug: LogDebugFn
}

const log = ((...args: unknown[]) => {
  dispatchLogEntry({ level: 'log', args })
}) as Log

log.info = (...args: unknown[]) => {
  dispatchLogEntry({ level: 'info', args })
}

log.warn = (...args: unknown[]) => {
  dispatchLogEntry({ level: 'warn', args })
}

log.error = (...args: unknown[]) => {
  dispatchLogEntry({ level: 'error', args })
}

log.debug = (module: string, ...args: unknown[]) => {
  if (!getConfig()?.debug) return
  dispatchLogEntry({ level: 'debug', module, args, timestamp: timestamp() })
}

export { log, warnRefSync, initLogRelay, closeLogRelay }
