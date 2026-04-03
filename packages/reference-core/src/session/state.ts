import type { SessionManifest, SessionMode, SessionState, BuildState } from './types'
import { writeManifest, writeLock, removeLock } from './files'

let currentManifest: SessionManifest | null = null
let currentOutDir: string | null = null

export function initSessionState(outDir: string, mode: SessionMode): void {
  currentOutDir = outDir
  const now = new Date().toISOString()
  currentManifest = {
    pid: process.pid,
    mode,
    state: 'starting',
    buildState: 'idle',
    startedAt: now,
    updatedAt: now,
  }
  writeLock(outDir, { pid: process.pid, startedAt: now })
  writeManifest(outDir, currentManifest)
}

export function transitionSession(state: SessionState): void {
  if (!currentManifest || !currentOutDir) return
  currentManifest = { ...currentManifest, state, updatedAt: new Date().toISOString() }
  writeManifest(currentOutDir, currentManifest)
}

export function transitionBuild(buildState: BuildState): void {
  if (!currentManifest || !currentOutDir) return
  currentManifest = { ...currentManifest, buildState, updatedAt: new Date().toISOString() }
  writeManifest(currentOutDir, currentManifest)
}

/** Mark as stopped and remove the lock file. */
export function cleanupSession(): void {
  if (!currentOutDir) return
  if (currentManifest) {
    transitionSession('stopped')
  }
  removeLock(currentOutDir)
}

export function getSessionManifest(): SessionManifest | null {
  return currentManifest
}

/** Reset module-level state. Useful in tests. */
export function resetSessionState(): void {
  currentManifest = null
  currentOutDir = null
}
