import pc from 'picocolors'
import { on, emit } from '../event-bus'

type LogFn = (...args: unknown[]) => void

type Log = LogFn & {
  error: LogFn
  debug: LogFn
}

let isDebug = false

/**
 * Direct print functions - use these in main thread for immediate output
 */
export function printInfo(...args: unknown[]) {
  console.log(...args)
}

export function printDebug(...args: unknown[]) {
  if (!isDebug) {
    return
  }
  console.log(pc.dim('debug'), ...args)
}

export function printError(...args: unknown[]) {
  console.error(pc.red('error'), ...args)
}

/**
 * Log object - emits events (works across threads)
 */
const log = ((...args: unknown[]) => {
  emit('log:info', { message: String(args[0] ?? ''), args: args.slice(1) })
}) as Log

log.error = (...args: unknown[]) => {
  emit('log:error', { message: String(args[0] ?? ''), args: args.slice(1) })
}

log.debug = (...args: unknown[]) => {
  emit('log:debug', { message: String(args[0] ?? ''), args: args.slice(1) })
}

/**
 * Initialize logging system and listen to log events from other threads
 */
export function initLog(config: { debug?: boolean }) {
  if (config.debug) {
    isDebug = true
  }

  // Listen for log events and print them
  on('log:info', ({ message, args = [] }) => {
    printInfo(message, ...args)
  })

  on('log:debug', ({ message, args = [] }) => {
    printDebug(message, ...args)
  })

  on('log:error', ({ message, args = [] }) => {
    printError(message, ...args)
  })
}

export { log }
