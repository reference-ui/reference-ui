/**
 * Dedicated channel handle (`openBusChannel`) so this pipe can close without
 * `closeEventBus`. Envelope helpers live in `event-bus/channel/wire.ts` next to `emit`.
 */
import { isMainThread, threadId } from 'node:worker_threads'
import { createBusEnvelope, openBusChannel, parseBusMessage } from '../event-bus/channel/wire'
import {
  isLogEntryPayload,
  LOG_ENTRY_EVENT,
  type LogEntryPayload,
  type LogLevel,
} from './events'
import { writeLogEntry } from './console-write'
import { formatTransportArg } from './serialize-args'

type WorkerLogFields = {
  level: LogLevel
  args: unknown[]
  module?: string
  label?: string
  badge?: string
  timestamp?: string
}

let isRelayInitialized = false
let logChannel: ReturnType<typeof openBusChannel> | undefined
let relayListener: ((msg: Event) => void) | undefined

function getLogChannel(): ReturnType<typeof openBusChannel> {
  if (logChannel) return logChannel

  logChannel = openBusChannel()
  return logChannel
}

function toRelayPayload(entry: WorkerLogFields): LogEntryPayload {
  return {
    ...entry,
    args: entry.args.map(formatTransportArg),
    source: 'worker',
    threadId,
  }
}

/** If postMessage fails, at least surface something on this thread. */
function writeWorkerLogFallback(entry: WorkerLogFields, error: unknown): void {
  writeLogEntry(
    'error',
    ['[log] Failed to forward worker log:', formatTransportArg(error)],
    { source: 'worker', threadId }
  )
  writeLogEntry(entry.level, entry.args.map(formatTransportArg), {
    module: entry.module,
    label: entry.label,
    badge: entry.badge,
    source: 'worker',
    threadId,
    timestamp: entry.timestamp,
  })
}

export function forwardWorkerLog(entry: WorkerLogFields): void {
  try {
    getLogChannel().postMessage(createBusEnvelope(LOG_ENTRY_EVENT, toRelayPayload(entry)))
  } catch (error) {
    writeWorkerLogFallback(entry, error)
  }
}

export function initLogRelay(): void {
  if (!isMainThread || isRelayInitialized) return

  relayListener = (msg: Event) => {
    const parsed = parseBusMessage((msg as MessageEvent).data)
    if (!parsed || parsed.event !== LOG_ENTRY_EVENT) return

    if (!isLogEntryPayload(parsed.payload)) return

    writeLogEntry(parsed.payload.level, parsed.payload.args, {
      module: parsed.payload.module,
      label: parsed.payload.label,
      badge: parsed.payload.badge,
      source: parsed.payload.source,
      threadId: parsed.payload.threadId,
      timestamp: parsed.payload.timestamp,
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
