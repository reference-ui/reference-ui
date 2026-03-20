import { BroadcastChannel, isMainThread, threadId } from 'node:worker_threads'
import type { LogEntryPayload, LogLevel } from './events'
import { writeLogEntry } from './console-write'
import { formatTransportArg } from './serialize-args'

let isRelayInitialized = false
let logChannel: BroadcastChannel | undefined
let relayListener: ((msg: Event) => void) | undefined

function getLogChannel(): BroadcastChannel {
  if (logChannel) return logChannel

  logChannel = new BroadcastChannel('reference-ui:events')
  return logChannel
}

export function forwardWorkerLog(entry: {
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
