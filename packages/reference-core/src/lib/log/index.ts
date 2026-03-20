import { inspect } from 'node:util'
import { BroadcastChannel, isMainThread, threadId } from 'node:worker_threads'
import pc from 'picocolors'
import { getConfig } from '../../config/store'
import type { LogEntryPayload, LogLevel } from './events'

type LogFn = (...args: unknown[]) => void
type LogDebugFn = (module: string, ...args: unknown[]) => void

type Log = LogFn & {
  error: LogFn
  info: LogFn
  debug: LogDebugFn
}

let isRelayInitialized = false
let logChannel: BroadcastChannel | undefined
let relayListener: ((msg: Event) => void) | undefined

function getLogChannel(): BroadcastChannel {
  if (logChannel) return logChannel

  logChannel = new BroadcastChannel('reference-ui:events')
  return logChannel
}

function timestamp(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function isPassThroughPrimitive(arg: unknown): boolean {
  const t = typeof arg
  return t === 'string' || t === 'number' || t === 'boolean' || t === 'undefined'
}

function isStringCoercedPrimitive(arg: unknown): boolean {
  const t = typeof arg
  return t === 'bigint' || t === 'function' || t === 'symbol'
}

function formatTransportArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`
  }
  if (isPassThroughPrimitive(arg)) {
    return arg
  }
  if (isStringCoercedPrimitive(arg)) {
    return String(arg)
  }
  if (arg === null) return null

  return inspect(arg, {
    colors: false,
    compact: false,
    breakLength: 80,
    depth: 6,
    sorted: true,
  })
}

function formatOriginPart(entry: {
  source?: 'worker'
  threadId?: number
}): string | undefined {
  if (entry.source !== 'worker' || typeof entry.threadId !== 'number') return undefined
  return pc.dim(`[worker:${entry.threadId}]`)
}

function writeLogEntry(
  level: LogLevel,
  args: unknown[],
  options: {
    module?: string
    source?: 'worker'
    threadId?: number
    timestamp?: string
  } = {}
): void {
  const originPart = formatOriginPart(options)
  const originArgs = originPart ? [originPart] : []

  if (level === 'log' || level === 'info') {
    console.log(...originArgs, ...args)
    return
  }

  if (level === 'error') {
    const colored = args.map(arg => (typeof arg === 'string' ? pc.red(arg) : arg))
    console.error(pc.red('error'), ...originArgs, ...colored)
    return
  }

  if (!getConfig()?.debug) return
  const timePart = pc.dim('[' + (options.timestamp ?? timestamp()) + ']')
  const modulePart = pc.blue('[' + (options.module ?? 'log') + ']')
  console.log(timePart, ...originArgs, modulePart, ...args)
}

function forwardWorkerLog(entry: {
  level: LogLevel
  args: unknown[]
  module?: string
  timestamp?: string
}): void {
  try {
    getLogChannel().postMessage({
      type: 'bus:event',
      event: 'log:entry',
      payload: {
        ...entry,
        args: entry.args.map(formatTransportArg),
        source: 'worker',
        threadId,
      },
    })
  } catch (error) {
    writeLogEntry(
      'error',
      ['[log] Failed to forward worker log:', formatTransportArg(error)],
      {
        source: 'worker',
        threadId,
      }
    )
    writeLogEntry(entry.level, entry.args.map(formatTransportArg), {
      module: entry.module,
      source: 'worker',
      threadId,
      timestamp: entry.timestamp,
    })
  }
}

function dispatchLogEntry(entry: {
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

function isLogEntryPayload(payload: unknown): payload is LogEntryPayload {
  if (!payload || typeof payload !== 'object') return false

  const candidate = payload as Partial<LogEntryPayload>
  return (
    candidate.source === 'worker' &&
    typeof candidate.threadId === 'number' &&
    Array.isArray(candidate.args) &&
    (candidate.level === 'log' ||
      candidate.level === 'info' ||
      candidate.level === 'error' ||
      candidate.level === 'debug')
  )
}

export function initLogRelay(): void {
  if (!isMainThread || isRelayInitialized) return

  relayListener = (msg: Event) => {
    const data = (msg as MessageEvent).data
    if (data?.type !== 'bus:event' || data?.event !== 'log:entry') return

    const payload = data.payload
    if (!isLogEntryPayload(payload)) return

    writeLogEntry(payload.level, payload.args, {
      module: payload.module,
      source: payload.source,
      threadId: payload.threadId,
      timestamp: payload.timestamp,
    })
  }

  getLogChannel().addEventListener('message', relayListener as EventListener)
  isRelayInitialized = true
}

export function closeLogRelay(): void {
  if (relayListener && logChannel) {
    logChannel.removeEventListener('message', relayListener as EventListener)
  }

  relayListener = undefined
  isRelayInitialized = false
  logChannel?.close()
  logChannel = undefined
}

const log = ((...args: unknown[]) => {
  dispatchLogEntry({ level: 'log', args })
}) as Log

log.info = (...args: unknown[]) => {
  dispatchLogEntry({ level: 'info', args })
}

log.error = (...args: unknown[]) => {
  dispatchLogEntry({ level: 'error', args })
}

log.debug = (module: string, ...args: unknown[]) => {
  if (!getConfig()?.debug) return
  dispatchLogEntry({ level: 'debug', module, args, timestamp: timestamp() })
}

export { log }
