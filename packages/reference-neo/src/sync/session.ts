// Sync session lock: the last-wins cross-process mutex behind `ref sync`.
// It takes a project root plus the session kind and emits a held lock whose
// release removes the lock dir. Concurrent syncs interleave in the cleanDir
// rm-window, so the latest call wins: it preempts the holder (kill, or a
// SIGUSR2 poke when a one-shot meets a resident watch) and takes over. The
// owner document model lives in session-owner.ts; this module owns the
// mkdir race, the preempt matrix, and the hold with its signal handlers.

import { randomBytes } from 'node:crypto'
import { readFileSync, rmSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { getOutDirPath } from '../lib/paths/index.ts'
import {
  SUPERSEDED_EXIT_CODE,
  SyncCoveredByWatchError,
  getSyncLockDir,
  getSyncOwnerPath,
  getSyncPreemptPath,
  lockActorTag,
  parseSyncSessionOwner,
  readOwnerFile,
  readPreemptMarkerSync,
  supersededMessage,
  throwSupersedeSignalError,
  writeLockFile,
  type OwnerRead,
  type SyncSessionKind,
  type SyncSessionOwner,
} from './session-owner.ts'

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

// Contention notices stay on stdout for human runs; JSON runs move them to
// stderr, where every other human line already rides.
function notice(json: boolean, line: string): void {
  if (json) console.error(line)
  else console.log(line)
}

export interface SyncSession {
  readonly owner: SyncSessionOwner
  release(): void
}

const KILL_GRACE_MS = 5000
const KILL_FORCE_GRACE_MS = 2000
const EXIT_POLL_MS = 50
const MISSING_OWNER_SETTLES_MS = [100, 500]
const TAKE_SETTLE_MS = 50
const MAX_ACQUIRE_ATTEMPTS = 25

// UNIFORM-KILL FLIP (spec section 3): one line. Set true to make one-shot
// toward watch KILL like every other leg instead of poking the watcher.
// HQ kept the poke; this line is the reversal switch. Leave it false.
const UNIFORM_KILL = false

type Contention = { action: 'take' } | { action: 'retry' }

interface HeldSession {
  owner: SyncSessionOwner
  onSigint: () => void
  onSigterm: () => void
  onSighup: () => void
}

// Process-local holds keyed by lock dir: a second acquire for a held dir
// (watch baseline and resyncs under the session) re-enters instead of
// preempting itself, and its release is a no-op.
const heldSessions = new Map<string, HeldSession>()

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException)?.code
}

// Liveness without /proc: signal 0 probes existence, and EPERM (a process
// we cannot signal) still counts as alive — the kill attempt then fails
// loud instead of taking over a live holder blind.
function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return errorCode(error) === 'EPERM'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), ms)
  })
}

function newSessionOwner(kind: SyncSessionKind): SyncSessionOwner {
  return {
    pid: process.pid,
    lockNonce: randomBytes(16).toString('hex'),
    kind,
    argv: [...process.argv],
    startedAt: new Date().toISOString(),
  }
}

// A missing owner usually means the winner has not finished writing yet, so
// settle twice before treating the dir as a crashed acquire. A live writer
// lands within milliseconds; only a corpse stays missing.
async function settleMissingOwner(lockDir: string): Promise<OwnerRead> {
  for (const waitMs of MISSING_OWNER_SETTLES_MS) {
    await sleep(waitMs)
    const again = await readOwnerFile(lockDir)
    if (again.status !== 'missing') return again
  }
  return { status: 'missing' }
}

async function tryClaimDir(lockDir: string): Promise<boolean> {
  try {
    await mkdir(lockDir)
    return true
  } catch (error) {
    if (errorCode(error) === 'EEXIST') return false
    throw error
  }
}

async function ownerNonceMatches(lockDir: string, nonce: string): Promise<boolean> {
  const back = await readOwnerFile(lockDir)
  return back.status === 'ok' && back.owner.lockNonce === nonce
}

// The claimed dir still needs its owner file: a racer's rm can land between
// our mkdir and this write, which reads as retry (never as held).
async function writeFreshOwner(lockDir: string, mine: SyncSessionOwner): Promise<boolean> {
  try {
    await writeLockFile(getSyncOwnerPath(lockDir), JSON.stringify(mine))
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return false
    throw error
  }
  return ownerNonceMatches(lockDir, mine.lockNonce)
}

// Steal the dir: bail when it changed hands since we read it, then rm plus
// atomic mkdir decides between racing takers, and a settle re-read closes
// the phantom double-hold window before we call it held.
async function forceTake(lockDir: string, mine: SyncSessionOwner, lastSeen: SyncSessionOwner | null): Promise<boolean> {
  if (lastSeen !== null) {
    const fresh = await readOwnerFile(lockDir)
    if (fresh.status === 'ok' && fresh.owner.lockNonce !== lastSeen.lockNonce) return false
  }
  await rm(lockDir, { recursive: true, force: true })
  try {
    await mkdir(lockDir)
  } catch (error) {
    if (errorCode(error) === 'EEXIST') return false
    throw error
  }
  if (!(await writeFreshOwner(lockDir, mine))) return false
  await sleep(TAKE_SETTLE_MS)
  return ownerNonceMatches(lockDir, mine.lockNonce)
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
// can print who superseded it. SIGKILL is the backstop; after it the lock
// is taken regardless, since the newcomer cleans first.
async function killHolder(lockDir: string, holder: SyncSessionOwner, mine: SyncSessionOwner): Promise<'dead' | 'retry'> {
  try {
    await writeLockFile(getSyncPreemptPath(lockDir), JSON.stringify({ pid: mine.pid, kind: mine.kind }))
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
  try {
    process.kill(holder.pid, 'SIGKILL')
  } catch (error) {
    if (errorCode(error) === 'ESRCH') return 'dead'
    throwSupersedeSignalError(holder, errorCode(error))
  }
  await waitForProcessExit(holder.pid, KILL_FORCE_GRACE_MS)
  return 'dead'
}

// Poke leg: the watch rebuilds now on SIGUSR2 and the newcomer exits 0
// covered, never syncing. A holder that died mid-poke reads as stale so the
// newcomer syncs instead of exiting covered with no watch behind it.
async function pokeWatchHolder(holder: SyncSessionOwner): Promise<'stale'> {
  if (process.platform !== 'win32') {
    try {
      process.kill(holder.pid, 'SIGUSR2')
    } catch (error) {
      if (errorCode(error) === 'ESRCH') return 'stale'
      throw error
    }
  }
  throw new SyncCoveredByWatchError(holder.pid)
}

// The preempt matrix: one-shot toward watch pokes (unless the uniform-kill
// flip says otherwise); every other live leg kills. Clean-kills-always falls
// out of the same shape: clean is never the poke newcomer and never the poke
// holder, so all four clean legs route to the kill branch with no carve-out.
async function preemptLiveHolder(lockDir: string, holder: SyncSessionOwner, mine: SyncSessionOwner, json: boolean): Promise<Contention> {
  const tag = lockActorTag(mine.kind)
  if (!UNIFORM_KILL && mine.kind === 'one-shot' && holder.kind === 'watch') {
    await pokeWatchHolder(holder)
    notice(json, `[ref] ${tag}: stale lock (pid ${holder.pid} not running), taking over`)
    return { action: 'take' }
  }
  const killed = await killHolder(lockDir, holder, mine)
  if (killed === 'retry') return { action: 'retry' }
  notice(json, `[ref] ${tag}: superseding sync pid ${holder.pid}, taking over`)
  return { action: 'take' }
}

// Contention over a well-formed owner: re-read before signaling (a changed
// nonce means the lock already moved on), then liveness, then the matrix.
// Our own pid with a foreign nonce is a phantom, never a signal target.
async function contendForLock(lockDir: string, first: SyncSessionOwner, mine: SyncSessionOwner, json: boolean): Promise<Contention> {
  const tag = lockActorTag(mine.kind)
  if (first.pid === process.pid) {
    notice(json, `[ref] ${tag}: stale lock (pid ${first.pid} is this process), taking over`)
    return { action: 'take' }
  }
  const again = await readOwnerFile(lockDir)
  if (again.status !== 'ok' || again.owner.lockNonce !== first.lockNonce) return { action: 'retry' }
  if (!pidAlive(first.pid)) {
    notice(json, `[ref] ${tag}: stale lock (pid ${first.pid} not running), taking over`)
    return { action: 'take' }
  }
  return preemptLiveHolder(lockDir, first, mine, json)
}

function warnBreakLock(seen: OwnerRead, mine: SyncSessionOwner, json: boolean): void {
  const tag = lockActorTag(mine.kind)
  if (seen.status === 'ok') {
    notice(json, `[ref] ${tag}: --break-lock: taking over lock held by pid ${seen.owner.pid}`)
  } else {
    notice(json, `[ref] ${tag}: --break-lock: taking over lock unconditionally`)
  }
}

// The EEXIST branch: break-lock takes unconditionally, an unreadable owner
// takes as stale, and a live owner routes through the matrix. Null retries.
async function acquireContendedLock(lockDir: string, mine: SyncSessionOwner, breakLock: boolean, json: boolean): Promise<SyncSession | null> {
  let seen = await readOwnerFile(lockDir)
  if (seen.status === 'missing') seen = await settleMissingOwner(lockDir)
  if (breakLock) {
    warnBreakLock(seen, mine, json)
    return (await forceTake(lockDir, mine, null)) ? holdSession(lockDir, mine, json) : null
  }
  if (seen.status !== 'ok') {
    notice(json, `[ref] ${lockActorTag(mine.kind)}: stale lock (owner unreadable), taking over`)
    return (await forceTake(lockDir, mine, null)) ? holdSession(lockDir, mine, json) : null
  }
  const verdict = await contendForLock(lockDir, seen.owner, mine, json)
  if (verdict.action === 'retry') return null
  return (await forceTake(lockDir, mine, seen.owner)) ? holdSession(lockDir, mine, json) : null
}

/**
 * Acquire the sync session lock for the project at cwd, first before any
 * sync write. Wins the atomic mkdir, takes stale locks with a warning, or
 * preempts the live holder by the matrix (kill, or a watch poke that throws
 * SyncCoveredByWatchError). Re-enters when this process already holds it.
 */
export async function acquireSyncSession(options: AcquireSyncSessionOptions): Promise<SyncSession> {
  const lockDir = getSyncLockDir(options.cwd)
  const held = heldSessions.get(lockDir)
  if (held !== undefined) return { owner: held.owner, release: () => {} }
  await mkdir(getOutDirPath(options.cwd), { recursive: true })
  const mine = newSessionOwner(options.kind)
  const json = options.json ?? false
  for (let attempt = 0; attempt < MAX_ACQUIRE_ATTEMPTS; attempt += 1) {
    if ((await tryClaimDir(lockDir)) && (await writeFreshOwner(lockDir, mine))) {
      return holdSession(lockDir, mine, json)
    }
    const session = await acquireContendedLock(lockDir, mine, options.breakLock ?? false, json)
    if (session !== null) return session
  }
  throw new Error('[ref] sync: lock contention did not settle')
}

// Release removes only our own lock: a foreign nonce means the dir changed
// hands (break-lock steal, takeover race) and stays untouched. A missing
// dir (failure-wipe, double release) is already released.
function releaseSession(lockDir: string): void {
  const held = heldSessions.get(lockDir)
  if (held === undefined) return
  heldSessions.delete(lockDir)
  process.removeListener('SIGINT', held.onSigint)
  process.removeListener('SIGTERM', held.onSigterm)
  process.removeListener('SIGHUP', held.onSighup)
  let owned = false
  try {
    const parsed = JSON.parse(readFileSync(getSyncOwnerPath(lockDir), 'utf8')) as unknown
    owned = parseSyncSessionOwner(parsed)?.lockNonce === held.owner.lockNonce
  } catch {
    return
  }
  if (!owned) return
  try {
    rmSync(lockDir, { recursive: true, force: true })
  } catch {
    // Best effort: a racing takeover owns the dir now, or it is already gone.
  }
}

// Foreign listeners own their own shutdown (the watch CLI stops gracefully
// on SIGINT/SIGTERM); each held session contributes exactly one listener per
// signal, so anything above the hold count is foreign.
function hasForeignListeners(signal: 'SIGINT' | 'SIGTERM' | 'SIGHUP'): boolean {
  return process.listenerCount(signal) > heldSessions.size
}

// Release-then-reraise: free the lock synchronously, then let a foreign
// shutdown run when one exists, else restore the default death.
function makeReraiseHandler(lockDir: string, signal: 'SIGINT' | 'SIGHUP'): () => void {
  const handler = (): void => {
    releaseSession(lockDir)
    if (hasForeignListeners(signal)) return
    process.removeListener(signal, handler)
    process.kill(process.pid, signal)
  }
  return handler
}

function holdSession(lockDir: string, owner: SyncSessionOwner, json: boolean): SyncSession {
  const onSigterm = (): void => {
    const marker = readPreemptMarkerSync(lockDir)
    if (marker !== null && marker.pid !== process.pid) {
      releaseSession(lockDir)
      notice(json, supersededMessage(marker.pid, marker.kind))
      process.exit(SUPERSEDED_EXIT_CODE)
    }
    if (owner.kind === 'watch') return
    releaseSession(lockDir)
    if (hasForeignListeners('SIGTERM')) return
    process.removeListener('SIGTERM', onSigterm)
    process.kill(process.pid, 'SIGTERM')
  }
  const held: HeldSession = {
    owner,
    onSigint: makeReraiseHandler(lockDir, 'SIGINT'),
    onSigterm,
    onSighup: makeReraiseHandler(lockDir, 'SIGHUP'),
  }
  heldSessions.set(lockDir, held)
  process.on('SIGINT', held.onSigint)
  process.on('SIGTERM', held.onSigterm)
  process.on('SIGHUP', held.onSighup)
  return { owner, release: () => releaseSession(lockDir) }
}
