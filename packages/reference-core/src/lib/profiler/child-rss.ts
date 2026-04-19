import { execFileSync } from 'node:child_process'
import { isMainThread } from 'node:worker_threads'
import { on } from '../event-bus'
import { isMemoryProfilerEnabled } from './env'

/** pid → worker_threads id of the isolate that spawned it (via `spawnMonitoredAsync`). */
const pidToThread = new Map<number, number>()

let listenersAttached = false

/**
 * Best-effort RSS for another process (POSIX). `ps` reports rss in **kilobytes** on macOS/Linux.
 * Returns `null` if the process vanished or the platform is unsupported.
 */
/** POSIX `ps` — absolute path so the child binary is not resolved via user-writable PATH entries. */
const PS_BIN = '/bin/ps'

export function samplePidRssBytes(pid: number): number | null {
  if (process.platform === 'win32') return null
  try {
    const out = execFileSync(PS_BIN, ['-o', 'rss=', '-p', String(pid)], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024,
      timeout: 200,
    })
    const kb = Number.parseInt(out.trim(), 10)
    if (!Number.isFinite(kb) || kb < 0) return null
    return kb * 1024
  } catch {
    return null
  }
}

function trackSpawn(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return
  const p = payload as { pid?: unknown; threadId?: unknown }
  const pid = typeof p.pid === 'number' ? p.pid : undefined
  const tid = typeof p.threadId === 'number' ? p.threadId : undefined
  if (pid !== undefined && tid !== undefined) {
    pidToThread.set(pid, tid)
  }
}

function trackExit(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return
  const p = payload as { pid?: unknown }
  const pid = typeof p.pid === 'number' ? p.pid : undefined
  if (pid !== undefined) {
    pidToThread.delete(pid)
  }
}

/**
 * Sum of sampled RSS for all **live** child PIDs attributed to this worker thread (from
 * `spawnMonitoredAsync` only). Main-thread spawns use `threadId` 0.
 */
export function sampleChildRssBytesForThread(threadId: number): number {
  let sum = 0
  for (const [pid, tid] of pidToThread) {
    if (tid !== threadId) continue
    const rss = samplePidRssBytes(pid)
    if (rss !== null) sum += rss
  }
  return sum
}

/**
 * Subscribe to `process:spawned` / `process:exit` on the main thread so HEAP_SPLIT can show child RSS.
 */
export function initProfilerChildRssRegistry(): void {
  if (!isMainThread || !isMemoryProfilerEnabled() || listenersAttached) return
  listenersAttached = true
  on('process:spawned', trackSpawn)
  on('process:exit', trackExit)
}

/** @internal Tests */
export function resetProfilerChildRssRegistryForTest(): void {
  pidToThread.clear()
}

/** @internal Tests */
export function seedProfilerChildRssRegistryForTest(pid: number, tid: number): void {
  pidToThread.set(pid, tid)
}
