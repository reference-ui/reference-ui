/**
 * Cross-process mutex for registry-side shared state.
 *
 * Concurrent matrix runs share the tarball directory, the registry manifest,
 * the loaded-state file, and the Verdaccio lifecycle. Those phases stay
 * serialized through this lock while the Dagger test lanes run in parallel.
 * The mutex is a lock directory with an owner file; a lock whose owner PID is
 * dead is treated as stale and removed. Nested acquisition within one process
 * is a no-op via a reentrancy flag so staged helpers can share one section.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { registryStateDir } from './paths.js'

const registryLockDir = resolve(registryStateDir, '.lock')
const registryLockOwnerFile = resolve(registryLockDir, 'owner.json')
const registryLockHeldEnvVar = 'REFERENCE_UI_REGISTRY_LOCK_HELD'

function isPidAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

function readLockOwnerPid(): number | null {
  if (!existsSync(registryLockOwnerFile)) {
    return null
  }

  try {
    const owner = JSON.parse(readFileSync(registryLockOwnerFile, 'utf8')) as { pid?: unknown }
    return typeof owner.pid === 'number' && Number.isFinite(owner.pid) ? owner.pid : null
  } catch {
    return null
  }
}

async function acquireRegistryLock(label: string): Promise<() => void> {
  try {
    mkdirSync(registryStateDir, { recursive: true })
  } catch {
    // Ignore missing-directory races; mkdir below reports real failures.
  }

  let loggedWait = false
  let lastLogTime = 0

  for (;;) {
    try {
      mkdirSync(registryLockDir)
      writeFileSync(
        registryLockOwnerFile,
        JSON.stringify({ label, pid: process.pid, startedAt: new Date().toISOString() }),
      )
      break
    } catch {
      const ownerPid = readLockOwnerPid()

      if (ownerPid !== null && !isPidAlive(ownerPid)) {
        try {
          rmSync(registryLockDir, { force: true, recursive: true })
        } catch {
          // Another waiter may have removed it first; retry acquisition.
        }
        continue
      }

      const now = Date.now()
      if (!loggedWait || now - lastLogTime > 10_000) {
        console.log(`[registry-lock] Waiting for registry lock (${label}). Held by PID ${ownerPid ?? 'unknown'}.`)
        loggedWait = true
        lastLogTime = now
      }

      await new Promise((resolvePromise) => {
        setTimeout(resolvePromise, 500)
      })
    }
  }

  if (loggedWait) {
    console.log(`[registry-lock] Registry lock acquired (${label}).`)
  }

  let released = false
  return () => {
    if (released) {
      return
    }
    released = true

    try {
      rmSync(registryLockDir, { force: true, recursive: true })
    } catch {
      // Lock already removed; nothing left to release.
    }
  }
}

export async function withRegistryLock<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
  if (process.env[registryLockHeldEnvVar] === '1') {
    return await fn()
  }

  const release = await acquireRegistryLock(label)
  const previous = process.env[registryLockHeldEnvVar]
  process.env[registryLockHeldEnvVar] = '1'

  try {
    return await fn()
  } finally {
    if (previous === undefined) {
      delete process.env[registryLockHeldEnvVar]
    } else {
      process.env[registryLockHeldEnvVar] = previous
    }
    release()
  }
}
