import { closeEventBus, on } from '../lib/event-bus'
import { log } from '../lib/log'
import { closeLogRelay } from '../lib/log'
import { shutdown as shutdownPool } from '../lib/thread-pool'

const LOG_SCOPE = 'sync:shutdown'
const SIGINT_EXIT_CODE = 130
const SIGTERM_EXIT_CODE = 143
const SHUTDOWN_TIMEOUT_MS = 5000
const PROCESS_EXIT_POLL_MS = 100
const FORCE_KILL_GRACE_MS = 1000

const trackedProcessPids = new Set<number>()

let initialized = false
let shutdownPromise: Promise<number> | undefined

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readPid(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined

  const pid = (payload as { pid?: unknown }).pid
  return typeof pid === 'number' ? pid : undefined
}

function trackProcess(payload: unknown): void {
  const pid = readPid(payload)
  if (typeof pid === 'number') {
    trackedProcessPids.add(pid)
  }
}

function untrackProcess(payload: unknown): void {
  const pid = readPid(payload)
  if (typeof pid === 'number') {
    trackedProcessPids.delete(pid)
  }
}

function killTrackedProcesses(signal: NodeJS.Signals): void {
  for (const pid of [...trackedProcessPids]) {
    try {
      process.kill(pid, signal)
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'ESRCH') {
        trackedProcessPids.delete(pid)
        continue
      }

      log.error('[sync] Failed to signal child process', { pid, signal, error })
    }
  }
}

async function waitForTrackedProcessesToExit(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (trackedProcessPids.size > 0 && Date.now() < deadline) {
    await sleep(PROCESS_EXIT_POLL_MS)
  }
}

async function terminateTrackedProcesses(): Promise<void> {
  if (trackedProcessPids.size === 0) return

  log.debug(LOG_SCOPE, 'Stopping child processes', [...trackedProcessPids])
  killTrackedProcesses('SIGTERM')
  await waitForTrackedProcessesToExit(SHUTDOWN_TIMEOUT_MS - FORCE_KILL_GRACE_MS)

  if (trackedProcessPids.size === 0) return

  log.debug(LOG_SCOPE, 'Force-killing child processes', [...trackedProcessPids])
  killTrackedProcesses('SIGKILL')
  await waitForTrackedProcessesToExit(FORCE_KILL_GRACE_MS)
}

export function initShutdown(): void {
  if (initialized) return

  initialized = true
  on('process:spawned', trackProcess)
  on('process:exit', untrackProcess)

  process.once('SIGINT', () => {
    void shutdownAndExit(SIGINT_EXIT_CODE, 'SIGINT')
  })

  process.once('SIGTERM', () => {
    void shutdownAndExit(SIGTERM_EXIT_CODE, 'SIGTERM')
  })
}

export async function shutdownAndExit(code: number, reason: string): Promise<number> {
  if (shutdownPromise) {
    return shutdownPromise
  }

  shutdownPromise = (async () => {
    let exitCode = code

    log.debug(LOG_SCOPE, `Starting shutdown (${reason})`)

    const forceExitTimer = setTimeout(() => {
      log.error('[sync] Shutdown timed out; forcing exit')
      process.exit(exitCode)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExitTimer.unref()

    try {
      await terminateTrackedProcesses()
      await shutdownPool()
    } catch (error) {
      exitCode = exitCode === 0 ? 1 : exitCode
      log.error('[sync] Shutdown failed:', error)
    } finally {
      clearTimeout(forceExitTimer)

      try {
        closeLogRelay()
      } catch (error) {
        exitCode = exitCode === 0 ? 1 : exitCode
        log.error('[sync] Failed to close log relay:', error)
      }

      try {
        closeEventBus()
      } catch (error) {
        exitCode = exitCode === 0 ? 1 : exitCode
        log.error('[sync] Failed to close event bus:', error)
      }

      process.exitCode = exitCode
    }

    // Relying on exitCode alone can leave the process alive if any handle keeps
    // the event loop open; `ref sync` must always terminate for execSync callers.
    process.exit(exitCode)
  })()

  return shutdownPromise
}
