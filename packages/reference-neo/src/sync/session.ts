// Sync session lock: the last-wins cross-process mutex behind `ref sync`.
// It takes a project root plus the session kind and emits a held lock whose
// release removes the lock dir. The latest call wins: it preempts the holder
// (kill, or a SIGUSR2 poke when a one-shot meets a resident watch), the loser
// dies mid-stage with the live folder untouched, and a second watch attaches to
// the owner instead of preempting. A watch with a graceful shutdown keeps its
// lock until that shutdown has settled the in-flight sync, every other holder
// answers a kill with exit 75 and leaves Ctrl-C a default death whose stale
// lock the next sync takes over, and the handlers are armed before the owner
// document is visible. The owner model lives in session-owner.ts, the mkdir race
// in session-claim.ts, the handlers in session-hold.ts, process identity in
// session-identity.ts and the one-shot's wait on a watch in session-covered.ts.

import { randomBytes } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { claimFreshLock, errorCode, forceTake, isRaceError, settleMissingOwner, sleep } from './session-claim.ts'
import { awaitWatchCoverage, awaitWatchRelease } from './session-covered.ts'
import { armSession, disarmSession, heldSessionAt, markHeld, notice, releaseHold, type SessionHold } from './session-hold.ts'
import { foreignHostOf, judgeHolder, ownHostname, ownIdentity, pidAlive, type HolderVerdict } from './session-identity.ts'
import {
  SyncCoveredByWatchError,
  getSyncLockDir,
  getSyncOwnerPath,
  getSyncPreemptPath,
  lockActorTag,
  readOwnerFile,
  sharedFolderLockMessage,
  throwSupersedeSignalError,
  writeLockFile,
  type OwnerRead,
  type SyncSessionKind,
  type SyncSessionOwner,
} from './session-owner.ts'

export { attachToWatchSession } from './session-attach.ts'
export { pidAlive } from './session-identity.ts'

export interface AcquireSyncSessionOptions {
  cwd: string
  kind: SyncSessionKind
  breakLock?: boolean
  /**
   * Machine-readable run: lock-takeover notices ride stderr so stdout
   * stays purely the diagnostics array. Threaded from `ref sync --json`.
   */
  json?: boolean
}

export interface SyncSession {
  readonly owner: SyncSessionOwner
  release(): void
}

const KILL_GRACE_MS = 5000
const KILL_FORCE_GRACE_MS = 2000
const EXIT_POLL_MS = 50
const MAX_ACQUIRE_ATTEMPTS = 25
// A lost race retries after a short random pause, so racers that collided
// once do not collide again in lockstep.
const RETRY_PAUSE_MS = { min: 5, spread: 25 }

// UNIFORM-KILL FLIP (spec section 3): one line. Set true to make one-shot
// toward watch KILL like every other leg instead of poking the watcher.
// HQ kept the poke; this line is the reversal switch. Leave it false.
const UNIFORM_KILL = false

type Contention = { action: 'take' } | { action: 'retry' }

function newSessionOwner(kind: SyncSessionKind): SyncSessionOwner {
  const identity = ownIdentity()
  const host = ownHostname()
  return {
    pid: process.pid,
    lockNonce: randomBytes(16).toString('hex'),
    kind,
    argv: [...process.argv],
    startedAt: new Date().toISOString(),
    ...(identity === undefined ? {} : { identity }),
    ...(host === undefined ? {} : { host }),
  }
}

async function waitForProcessExit(pid: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!pidAlive(pid)) return true
    await sleep(EXIT_POLL_MS)
  }
  return !pidAlive(pid)
}

// Kill leg: the marker names the newcomer so the victim's SIGTERM handler
// can print who superseded it. SIGKILL is the backstop, aimed only at a pid
// that still is the holder; after it the lock is taken regardless, since the
// newcomer cleans first.
async function killHolder(lockDir: string, holder: SyncSessionOwner, mine: SyncSessionOwner): Promise<'dead' | 'retry'> {
  try {
    await writeLockFile(getSyncPreemptPath(lockDir), JSON.stringify({ pid: mine.pid, kind: mine.kind, target: holder.lockNonce }))
  } catch {
    return 'retry'
  }
  try {
    process.kill(holder.pid, 'SIGTERM')
  } catch (error) {
    const code = errorCode(error)
    if (code === 'ESRCH') return 'dead'
    throwSupersedeSignalError(holder, code)
  }
  if (await waitForProcessExit(holder.pid, KILL_GRACE_MS)) return 'dead'
  if (judgeHolder(holder) !== 'live') return 'dead'
  try {
    process.kill(holder.pid, 'SIGKILL')
  } catch (error) {
    if (errorCode(error) === 'ESRCH') return 'dead'
    throwSupersedeSignalError(holder, errorCode(error))
  }
  await waitForProcessExit(holder.pid, KILL_FORCE_GRACE_MS)
  return 'dead'
}

// Poke leg: the watch rebuilds now on SIGUSR2 and the newcomer waits on the
// watch-state handshake until that rebuild is current (covered, exit 0) or
// failed (exit 1). A watch that is stopping or gone is waited out and the lock
// is contended again, so the newcomer syncs itself. A watch that keeps no state
// file gets the poke alone and the newcomer reports itself covered.
async function coverOneShot(lockDir: string, holder: SyncSessionOwner, json: boolean): Promise<Contention> {
  const outcome = await awaitWatchCoverage(lockDir, holder, { say: (line) => notice(json, line) })
  if (outcome === 'failed') throw new Error("[ref] sync: the resident watch's sync failed")
  if (outcome === 'retake') {
    await awaitWatchRelease(lockDir, holder)
    return { action: 'retry' }
  }
  throw new SyncCoveredByWatchError(holder.pid)
}

// The preempt matrix: one-shot toward watch pokes (unless the uniform-kill
// flip says otherwise); every other live leg kills. Clean-kills-always falls
// out of the same shape: clean is never the poke newcomer and never the poke
// holder, so all four clean legs route to the kill branch with no carve-out.
async function preemptLiveHolder(lockDir: string, holder: SyncSessionOwner, mine: SyncSessionOwner, json: boolean): Promise<Contention> {
  const tag = lockActorTag(mine.kind)
  // A resident watch OWNS the project against sync newcomers: never kill
  // it. A one-shot pokes it to rebuild and reports itself covered once the
  // rebuild is current; a second watch defers outright (the CLI attaches it to
  // the owner instead of exiting), so starting a dev server (or `ref sync
  // --watch`) twice can never tear down the one that is already running.
  // `--break-lock` is the only forced sync takeover. Clean is the exception:
  // an explicit `ref clean` kills any live holder including a watch
  // (clean-kills-always), as a wipe cannot proceed under a live writer and
  // clean has no --break-lock.
  if (!UNIFORM_KILL && holder.kind === 'watch' && mine.kind !== 'clean') {
    if (mine.kind === 'one-shot') return coverOneShot(lockDir, holder, json)
    throw new SyncCoveredByWatchError(holder.pid)
  }
  const killed = await killHolder(lockDir, holder, mine)
  if (killed === 'retry') return { action: 'retry' }
  notice(json, `[ref] ${tag}: superseding sync pid ${holder.pid}, taking over`)
  return { action: 'take' }
}

function staleReason(holder: SyncSessionOwner, verdict: Exclude<HolderVerdict, 'live'>): string {
  return verdict === 'dead' ? `pid ${holder.pid} not running` : `pid ${holder.pid} now belongs to another process`
}

// Contention over a well-formed owner: re-read before signaling (a changed
// nonce means the lock already moved on), then the host (an owner on another
// machine is live by assumption: its pid names nothing here, so it is never
// judged, taken or signaled, and the newcomer fails), then liveness by identity
// (a dead pid, or one recycled to an unrelated process, is stale and never
// signaled), then the matrix. Our own pid with a foreign nonce is a phantom,
// never a signal target, unless the owner ran on another machine, where the same
// pid number is a coincidence.
async function contendForLock(lockDir: string, first: SyncSessionOwner, mine: SyncSessionOwner, json: boolean): Promise<Contention> {
  const tag = lockActorTag(mine.kind)
  const elsewhere = foreignHostOf(first)
  if (first.pid === process.pid && elsewhere === undefined) {
    notice(json, `[ref] ${tag}: stale lock (pid ${first.pid} is this process), taking over`)
    return { action: 'take' }
  }
  const again = await readOwnerFile(lockDir)
  if (again.status !== 'ok' || again.owner.lockNonce !== first.lockNonce) return { action: 'retry' }
  if (elsewhere !== undefined) throw new Error(sharedFolderLockMessage(first.pid, elsewhere, mine.kind))
  const verdict = judgeHolder(first)
  if (verdict !== 'live') {
    notice(json, `[ref] ${tag}: stale lock (${staleReason(first, verdict)}), taking over`)
    return { action: 'take' }
  }
  return preemptLiveHolder(lockDir, first, mine, json)
}

function warnBreakLock(seen: OwnerRead, mine: SyncSessionOwner, json: boolean): void {
  const tag = lockActorTag(mine.kind)
  if (seen.status === 'ok') {
    const elsewhere = foreignHostOf(seen.owner)
    const where = elsewhere === undefined ? '' : ` on host ${elsewhere}`
    notice(json, `[ref] ${tag}: --break-lock: taking over lock held by pid ${seen.owner.pid}${where}`)
  } else {
    notice(json, `[ref] ${tag}: --break-lock: taking over lock unconditionally`)
  }
}

// The EEXIST branch: break-lock takes unconditionally, an unreadable owner
// takes as stale, and a live owner routes through the matrix. False retries.
async function takeContendedLock(hold: SessionHold, breakLock: boolean): Promise<boolean> {
  const { lockDir, owner: mine, json } = hold
  const onPublish = (): void => {
    hold.published = true
  }
  let seen = await readOwnerFile(lockDir)
  if (seen.status === 'missing') seen = await settleMissingOwner(lockDir)
  if (breakLock) {
    warnBreakLock(seen, mine, json)
    return forceTake(lockDir, mine, null, onPublish)
  }
  if (seen.status !== 'ok') {
    notice(json, `[ref] ${lockActorTag(mine.kind)}: stale lock (owner unreadable), taking over`)
    return forceTake(lockDir, mine, null, onPublish)
  }
  const verdict = await contendForLock(lockDir, seen.owner, mine, json)
  return verdict.action === 'take' && (await forceTake(lockDir, mine, seen.owner, onPublish))
}

function describeRace(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// Loop until this hold owns the lock dir, throwing when it cannot. A lost race
// (including the filesystem errors only a race produces) pauses briefly and
// retries; the attempt budget bounds a race that never settles, and a
// permanent fault such as EACCES fails at once.
async function winLock(hold: SessionHold, breakLock: boolean): Promise<void> {
  let lastRace: unknown
  const onPublish = (): void => {
    hold.published = true
  }
  for (let attempt = 0; attempt < MAX_ACQUIRE_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_PAUSE_MS.min + Math.random() * RETRY_PAUSE_MS.spread)
    try {
      // The generated folder itself can vanish between attempts (a racing config
      // load drops it while it is empty), so each attempt makes sure it is there.
      await mkdir(dirname(hold.lockDir), { recursive: true })
      if ((await claimFreshLock(hold.lockDir, hold.owner, onPublish)) || (await takeContendedLock(hold, breakLock))) return
    } catch (error) {
      if (!isRaceError(error)) throw error
      lastRace = error
    }
  }
  const cause = lastRace === undefined ? '' : ` (${describeRace(lastRace)})`
  throw new Error(`[ref] sync: lock contention did not settle${cause}`)
}

/**
 * Acquire the sync session lock for the project at cwd, first before any
 * sync write. Arms the stop handlers, then wins the atomic mkdir, takes stale
 * locks (dead or recycled holder) with a warning, or preempts the live holder
 * by the matrix (kill, or a watch poke that waits on the watch and throws
 * SyncCoveredByWatchError). Re-enters when this process already holds it.
 */
export async function acquireSyncSession(options: AcquireSyncSessionOptions): Promise<SyncSession> {
  const lockDir = getSyncLockDir(options.cwd)
  const held = heldSessionAt(lockDir)
  if (held !== undefined) return { owner: held.owner, release: () => {} }
  const hold = armSession(lockDir, newSessionOwner(options.kind), options.json ?? false)
  try {
    await winLock(hold, options.breakLock ?? false)
  } catch (error) {
    disarmSession(hold)
    throw error
  }
  markHeld(hold)
  return { owner: hold.owner, release: () => releaseHold(hold) }
}

/**
 * Re-claim the lock this process holds when its lock dir vanished under it
 * (the generated folder deleted during a watch). Only a missing owner is
 * re-asserted, from the same owner document, so pid and nonce stay this
 * process's; a foreign or unreadable owner means the lock moved on and is left
 * alone. Resolves true when it re-asserted the lock, false when nothing needed it.
 */
export async function reassertHeldSession(cwd: string): Promise<boolean> {
  const lockDir = getSyncLockDir(cwd)
  const held = heldSessionAt(lockDir)
  if (held === undefined) return false
  if ((await readOwnerFile(lockDir)).status !== 'missing') return false
  await mkdir(lockDir, { recursive: true })
  await writeLockFile(getSyncOwnerPath(lockDir), JSON.stringify(held.owner))
  return true
}
