import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { SessionManifest, SessionLock } from './types'

export const SESSION_FILE = 'session.json'
export const LOCK_FILE = 'session.lock'

export function sessionPath(outDir: string): string {
  return join(outDir, SESSION_FILE)
}

export function lockPath(outDir: string): string {
  return join(outDir, LOCK_FILE)
}

export function writeManifest(outDir: string, manifest: SessionManifest): void {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(sessionPath(outDir), JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
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
 * Returns true if the process with the given pid is alive.
 * Uses signal 0 which checks existence without sending a signal.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** A lock is stale when the recorded pid is no longer running. */
export function isLockStale(lock: SessionLock): boolean {
  return !isProcessAlive(lock.pid)
}
