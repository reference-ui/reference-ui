import pc from 'picocolors'
import { isMainThread } from 'node:worker_threads'
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

function timestamp(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

export function printDebug(...args: unknown[]) {
  if (!isDebug) {
    return
  }
  const colored = args.map((arg) =>
    typeof arg === 'string' ? pc.dim(arg) : arg
  )
  console.log(pc.dim(`[${timestamp()}] debug`), ...colored)
}

export function printError(...args: unknown[]) {
  const colored = args.map((arg) =>
    typeof arg === 'string' ? pc.red(arg) : arg
  )
  console.error(pc.red('error'), ...colored)
}

/**
 * Log object - emits events (works across threads)
 */
const log = ((...args: unknown[]) => {
  const message = String(args[0] ?? '')
  const rest = args.slice(1)
  if (isMainThread) {
    printInfo(message, ...rest)
    return
  }
  emit('log:info', { message, args: rest })
}) as Log

log.error = (...args: unknown[]) => {
  const message = String(args[0] ?? '')
  const rest = args.slice(1)
  if (isMainThread) {
    printError(message, ...rest)
    return
  }
  emit('log:error', { message, args: rest })
}

log.debug = (...args: unknown[]) => {
  const message = String(args[0] ?? '')
  const rest = args.slice(1)
  if (isMainThread) {
    printDebug(message, ...rest)
    return
  }
  emit('log:debug', { message, args: rest })
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
