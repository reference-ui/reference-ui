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
    completedAt: null,
  }
  // Lock is watch-only. One-shot syncs are transient and may legitimately
  // run alongside a watch process — writing a lock would overwrite the watch
  // process's lock and removing it on cleanup would leave the watch unguarded.
  if (mode === 'watch') {
    writeLock(outDir, { pid: process.pid, startedAt: now })
  }
  writeManifest(outDir, currentManifest)
}

export function transitionSession(state: SessionState): void {
  if (!currentManifest || !currentOutDir) return
  currentManifest = { ...currentManifest, state, updatedAt: new Date().toISOString() }
  writeManifest(currentOutDir, currentManifest)
}

export function transitionBuild(buildState: BuildState): void {
  if (!currentManifest || !currentOutDir) return
  currentManifest = {
    ...currentManifest,
    buildState,
    updatedAt: new Date().toISOString(),
    completedAt: buildState === 'ready' ? currentManifest.completedAt ?? null : null,
  }
  writeManifest(currentOutDir, currentManifest)
}

export function markBuildComplete(): void {
  if (!currentManifest || !currentOutDir) return
  currentManifest = {
    ...currentManifest,
    completedAt: new Date().toISOString(),
  }
  writeManifest(currentOutDir, currentManifest)
}

/** Mark as stopped and, for watch sessions only, remove the lock file. */
export function cleanupSession(): void {
  if (!currentOutDir) return
  if (currentManifest) {
    transitionSession('stopped')
  }
  if (currentManifest?.mode === 'watch') {
    removeLock(currentOutDir)
  }
}

export function getSessionManifest(): SessionManifest | null {
  return currentManifest
}

/** Reset module-level state. Useful in tests. */
export function resetSessionState(): void {
  currentManifest = null
  currentOutDir = null
}
