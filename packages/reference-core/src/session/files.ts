import {
  writeFileSync,
  readFileSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  openSync,
  writeSync,
  closeSync,
  renameSync,
} from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import type { SessionManifest, SessionLock } from './types'

export const SESSION_FILE = 'session.json'
export const LOCK_FILE = 'session.lock'

export function sessionPath(outDir: string): string {
  return join(outDir, SESSION_FILE)
}

export function lockPath(outDir: string): string {
  return join(outDir, LOCK_FILE)
}

/**
 * Write `content` to `filePath` atomically via a sibling tmp file + renameSync.
 * On POSIX, rename(2) is atomic for files on the same filesystem, so readers
 * always see either the old or new complete content — never a partial write.
 */
function atomicWriteFile(filePath: string, content: string): void {
  const tmp = `${filePath}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(tmp, content, 'utf-8')
  renameSync(tmp, filePath)
}

export function writeManifest(outDir: string, manifest: SessionManifest): void {
  mkdirSync(outDir, { recursive: true })
  atomicWriteFile(sessionPath(outDir), JSON.stringify(manifest, null, 2) + '\n')
}

export function readManifest(outDir: string): SessionManifest | null {
  const path = sessionPath(outDir)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as SessionManifest
  } catch {
    return null
  }
}

/** Direct (non-exclusive) lock write — used by tests and state.ts internals. */
export function writeLock(outDir: string, lock: SessionLock): void {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(lockPath(outDir), JSON.stringify(lock, null, 2) + '\n', 'utf-8')
}

export function readLock(outDir: string): SessionLock | null {
  const path = lockPath(outDir)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as SessionLock
  } catch {
    return null
  }
}

export function removeLock(outDir: string): void {
  try {
    unlinkSync(lockPath(outDir))
  } catch {
    // Already gone — nothing to do.
  }
}

/**
 * Attempt to atomically acquire the session lock using O_EXCL (exclusive create).
 *
 * Returns:
 *  - `'acquired'`  — lock file created, caller owns it.
 *  - `'contested'` — another live process holds the lock; caller should abort.
 *  - `'stale'`     — an existing lock was held by a dead process and has been
 *                    removed; caller should retry once.
 */
export function tryAcquireLock(outDir: string, lock: SessionLock): 'acquired' | 'contested' | 'stale' {
  const path = lockPath(outDir)
  mkdirSync(outDir, { recursive: true })
  const content = JSON.stringify(lock, null, 2) + '\n'
  try {
    // 'wx' = O_WRONLY | O_CREAT | O_EXCL — fails with EEXIST if the file already exists.
    const fd = openSync(path, 'wx')
    writeSync(fd, content, 0, 'utf-8')
    closeSync(fd)
    return 'acquired'
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
    // Lock file exists — determine if the holder is still alive.
    const existing = readLock(outDir)
    if (existing !== null && !isLockStale(existing)) return 'contested'
    // Stale lock — remove it so the caller can retry.
    try {
      unlinkSync(path)
    } catch {
      // Another process may have already removed it — that's fine.
    }
    return 'stale'
  }
}

/**
 * Returns true if the process with the given pid is alive.
 * Uses signal 0 which checks existence without sending a real signal.
 *
 * Note: on POSIX, `kill(pid, 0)` throws EPERM when the process exists but the
 * current user lacks permission to signal it.  That still means the process is
 * alive, so EPERM is treated as "alive".  Only ESRCH (no such process) means dead.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EPERM') return true
    return false
  }
}

/** A lock is stale when the recorded pid is no longer running. */
export function isLockStale(lock: SessionLock): boolean {
  return !isProcessAlive(lock.pid)
}
