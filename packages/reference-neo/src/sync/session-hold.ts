// Sync session hold: a session's footprint in its own process. It takes a lock
// dir, the owner document and the json flag and emits an armed footprint, the
// three stop handlers on the process, which is armed before the owner document
// can be seen on disk and held once the lock is won, so a kill can never meet a
// process without them. The handlers free a one-shot's lock at once, let a watch
// with a graceful shutdown keep it until that shutdown settles, and answer a
// newcomer's kill with exit 75 while keeping their listeners on until the exit.

import { rmSync } from 'node:fs'
import {
  STOP_SIGNALS,
  SUPERSEDED_EXIT_CODE,
  readOwnerFileSync,
  readPreemptMarkerSync,
  supersededMessage,
  type StopSignal,
  type SyncSessionKind,
  type SyncSessionOwner,
} from './session-owner.ts'

// Contention notices stay on stdout for human runs; JSON runs move them to
// stderr, where every other human line already rides.
export function notice(json: boolean, line: string): void {
  if (json) console.error(line)
  else console.log(line)
}

// A session's footprint in this process: its owner document and its three stop
// handlers. It is armed (handlers on) before the owner document can be seen on
// disk and held once the lock is won; the same footprint serves both, so a kill
// can never meet a process whose handlers are not there yet.
export interface SessionHold {
  lockDir: string
  owner: SyncSessionOwner
  json: boolean
  handlers: Map<StopSignal, () => void>
  /** True once this process has begun writing its owner document, so a newcomer may be aiming a kill at it. */
  published: boolean
}

// Every footprint with handlers installed, and the won ones by lock dir: a
// second acquire for a held dir (watch baseline and resyncs under the session)
// re-enters instead of preempting itself, and its release is a no-op.
const armedSessions = new Set<SessionHold>()
const heldSessions = new Map<string, SessionHold>()

/** The footprint that won the lock at this dir in this process, if any. */
export function heldSessionAt(lockDir: string): SessionHold | undefined {
  return heldSessions.get(lockDir)
}

/** The acquire won: the footprint now serves re-entry and re-assert. */
export function markHeld(hold: SessionHold): void {
  heldSessions.set(hold.lockDir, hold)
}

// Foreign listeners own their own shutdown (the watch CLI stops gracefully on
// SIGINT/SIGTERM/SIGHUP); each footprint contributes exactly one listener per
// signal, so anything above the armed count is foreign.
function hasForeignListeners(signal: StopSignal): boolean {
  return process.listenerCount(signal) > armedSessions.size
}

// Our lock, by its owner document: a foreign nonce means the dir changed hands
// (break-lock steal, takeover race) and a missing or torn owner means nothing
// of ours is on disk to remove.
function ownsLockDir(hold: SessionHold): boolean {
  const seen = readOwnerFileSync(hold.lockDir)
  return seen.status === 'ok' && seen.owner.lockNonce === hold.owner.lockNonce
}

// The lock dir now carries another session's owner document: it was taken from
// us, which is stronger than missing (a deleted folder the watch re-asserts).
function lockMovedOn(hold: SessionHold): boolean {
  const seen = readOwnerFileSync(hold.lockDir)
  return seen.status === 'ok' && seen.owner.lockNonce !== hold.owner.lockNonce
}

// Take the footprint's handlers off the process and forget it, without
// touching the disk: the failure leg of an acquire that never won.
export function disarmSession(hold: SessionHold): void {
  armedSessions.delete(hold)
  if (heldSessions.get(hold.lockDir) === hold) heldSessions.delete(hold.lockDir)
  for (const [signal, handler] of hold.handlers) process.removeListener(signal, handler)
}

// Free the lock dir, only while it is ours: a foreign nonce means it changed
// hands and stays untouched; a missing dir is already free.
function removeOwnLockDir(hold: SessionHold): void {
  if (!ownsLockDir(hold)) return
  try {
    rmSync(hold.lockDir, { recursive: true, force: true })
  } catch {
    // Best effort: a racing takeover owns the dir now, or it is already gone.
  }
}

export function releaseHold(hold: SessionHold): void {
  if (!armedSessions.has(hold)) return
  disarmSession(hold)
  removeOwnLockDir(hold)
}

// Who took the lock from this holder, as the SIGTERM it just got reads it: the
// newcomer its preempt marker names, or nobody by name when the lock now
// belongs to another session (a late taker beat the marker). Null means the
// SIGTERM is a plain stop. A marker aimed at another holder is not ours.
function supersededBy(hold: SessionHold): { pid: number; kind: SyncSessionKind } | 'unnamed' | null {
  const marker = readPreemptMarkerSync(hold.lockDir)
  const aimedAtUs = marker !== null && (marker.target === undefined || marker.target === hold.owner.lockNonce)
  if (marker !== null && aimedAtUs && marker.pid !== process.pid) return marker
  return hold.published && lockMovedOn(hold) ? 'unnamed' : null
}

// A SIGTERM from a newcomer's kill leg: that newcomer takes the lock next, so
// the victim frees it now and exits 75 naming the newcomer, graceful shutdown or
// not. The handlers stay on until the exit, because a repeat SIGTERM (several
// newcomers kill the same holder) that lands once the last listener is gone
// would kill the process by default and swallow the 75.
function exitIfSuperseded(hold: SessionHold): void {
  const by = supersededBy(hold)
  if (by === null) return
  removeOwnLockDir(hold)
  notice(hold.json, by === 'unnamed' ? '[ref] sync superseded' : supersededMessage(by.pid, by.kind))
  process.exit(SUPERSEDED_EXIT_CODE)
}

// The stop-signal handler of one footprint. A watch owner whose process has a
// foreign (graceful) shutdown keeps its lock: that shutdown settles the
// in-flight sync first and releases after, so a newcomer can never take the
// lock while the old sync still writes the folder. Every other holder releases
// synchronously, then lets a foreign shutdown run when one exists, else
// restores the default death. A watch with no graceful shutdown yet (still
// booting) dies like the rest, its lock freed as it goes.
function makeStopHandler(hold: SessionHold, signal: StopSignal): () => void {
  const handler = (): void => {
    if (signal === 'SIGTERM') exitIfSuperseded(hold)
    const graceful = hasForeignListeners(signal)
    if (graceful && hold.owner.kind === 'watch') return
    releaseHold(hold)
    if (graceful) return
    process.removeListener(signal, handler)
    process.kill(process.pid, signal)
  }
  return handler
}

export function armSession(lockDir: string, owner: SyncSessionOwner, json: boolean): SessionHold {
  const hold: SessionHold = { lockDir, owner, json, handlers: new Map(), published: false }
  for (const signal of STOP_SIGNALS) {
    const handler = makeStopHandler(hold, signal)
    hold.handlers.set(signal, handler)
    process.on(signal, handler)
  }
  armedSessions.add(hold)
  return hold
}

