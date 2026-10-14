// Sync session owner: the lock-dir document model behind `ref sync`.
// It takes lock-dir paths and emits validated owners, owner reads, the
// watch-state handshake file, and the exit-path messages. The acquire engine
// in session.ts owns the mkdir race, the preempt matrix, and the hold; this
// module owns what the lock dir means on disk. The watch-state file is the
// covered handshake: a resident watch publishes how many pokes it has taken
// and how many resyncs have answered them, and a one-shot that meets it waits
// on those counters instead of exiting before the output is current.

import { randomBytes } from 'node:crypto'
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getOutDirPath } from '../lib/paths/index.ts'

export type SyncSessionKind = 'one-shot' | 'watch' | 'clean'

// The signals that end a session: Ctrl-C, a supervisor's terminate, and the
// terminal hanging up. A held session and an attached client both answer them.
export const STOP_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const
export type StopSignal = (typeof STOP_SIGNALS)[number]

export interface SyncSessionOwner {
  pid: number
  lockNonce: string
  kind: SyncSessionKind
  argv: string[]
  startedAt: string
  /**
   * The owner process's start time as session-identity.ts reads it. A reader
   * trusts the pid only while the running process still has this identity; an
   * owner that could not read its own (Windows, no ps) records none.
   */
  identity?: string
  /**
   * The hostname of the machine the owner ran on. A pid names a process only on
   * its own machine, so on a generated folder shared between machines a reader
   * whose hostname differs never judges or signals this owner. An owner that
   * recorded none is taken to be on the reader's machine.
   */
  host?: string
}

export type OwnerRead =
  | { status: 'ok'; owner: SyncSessionOwner }
  | { status: 'missing' }
  | { status: 'malformed' }

export const SYNC_LOCK_DIR_NAME = 'sync.lock'
export const SUPERSEDED_EXIT_CODE = 75

const OWNER_FILE = 'owner.json'
const PREEMPT_FILE = 'preempt.json'
const WATCH_STATE_FILE = 'watch-state.json'

export function getSyncLockDir(cwd: string): string {
  return join(getOutDirPath(cwd), SYNC_LOCK_DIR_NAME)
}

export function getSyncOwnerPath(lockDir: string): string {
  return join(lockDir, OWNER_FILE)
}

export function getSyncPreemptPath(lockDir: string): string {
  return join(lockDir, PREEMPT_FILE)
}

export function getWatchStatePath(lockDir: string): string {
  return join(lockDir, WATCH_STATE_FILE)
}

export function coveredByWatchMessage(watchPid: number): string {
  return `[ref] already watching this project (pid ${watchPid}) — using the running session`
}

export function supersededMessage(newcomerPid: number, newcomerKind: SyncSessionKind = 'one-shot'): string {
  return `[ref] sync superseded by ${lockActorTag(newcomerKind)} pid ${newcomerPid}`
}

export function throwSupersedeSignalError(holder: SyncSessionOwner, code: string | undefined): never {
  throw new Error(`[ref] sync: cannot supersede ${lockActorTag(holder.kind)} pid ${holder.pid} (${code ?? 'signal failed'})`)
}

// A holder on another machine is live by assumption and never signalled, so the
// newcomer fails and says how to proceed. `ref clean` has no --break-lock, so it
// points at the sync command that has one.
export function sharedFolderLockMessage(holderPid: number, holderHost: string, newcomerKind: SyncSessionKind): string {
  const way = newcomerKind === 'clean' ? 'take the lock first with `ref sync --break-lock`' : 'rerun with --break-lock'
  return `[ref] ${lockActorTag(newcomerKind)}: the lock is held by pid ${holderPid} on host ${holderHost}; the generated folder is on a shared filesystem. Stop that sync, or ${way}`
}

export class SyncCoveredByWatchError extends Error {
  readonly watchPid: number

  constructor(watchPid: number) {
    super(coveredByWatchMessage(watchPid))
    this.name = 'SyncCoveredByWatchError'
    this.watchPid = watchPid
  }
}

export function isLivePid(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isSessionKind(value: unknown): value is SyncSessionKind {
  return value === 'one-shot' || value === 'watch' || value === 'clean'
}

// The CLI actor tag: sync legs report as sync, the clean writer as clean,
// so preempt and takeover lines name the command that took the lock.
export function lockActorTag(kind: SyncSessionKind): string {
  return kind === 'clean' ? 'clean' : 'sync'
}

function stringEntries(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

// The fields an owner may leave out: one that is missing or unreadable reads as
// none, so an older writer's document and a host with no identity still parse.
function optionalOwnerFields(candidate: Record<string, unknown>): Pick<SyncSessionOwner, 'identity' | 'host'> {
  const fields: Pick<SyncSessionOwner, 'identity' | 'host'> = {}
  if (isNonEmptyString(candidate.identity)) fields.identity = candidate.identity
  if (isNonEmptyString(candidate.host)) fields.host = candidate.host
  return fields
}

// Owner validation: every field the takeover path trusts is checked, so a
// torn write or a foreign file reads as malformed (stale) instead of a kill
// target. argv/startedAt are forensic only and degrade to empties; identity
// and host are optional.
export function parseSyncSessionOwner(value: unknown): SyncSessionOwner | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>
  if (!isLivePid(candidate.pid)) return null
  if (!isNonEmptyString(candidate.lockNonce)) return null
  if (!isSessionKind(candidate.kind)) return null
  return {
    pid: candidate.pid,
    lockNonce: candidate.lockNonce,
    kind: candidate.kind,
    argv: stringEntries(candidate.argv),
    startedAt: typeof candidate.startedAt === 'string' ? candidate.startedAt : '',
    ...optionalOwnerFields(candidate),
  }
}

function ownerReadOf(raw: string): OwnerRead {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { status: 'malformed' }
  }
  const owner = parseSyncSessionOwner(parsed)
  return owner === null ? { status: 'malformed' } : { status: 'ok', owner }
}

export async function readOwnerFile(lockDir: string): Promise<OwnerRead> {
  let raw: string
  try {
    raw = await readFile(getSyncOwnerPath(lockDir), 'utf8')
  } catch {
    return { status: 'missing' }
  }
  return ownerReadOf(raw)
}

// The synchronous twin, for the check that must sit right beside an action
// (the takeover's remove) with no await for a racer to slip through.
export function readOwnerFileSync(lockDir: string): OwnerRead {
  let raw: string
  try {
    raw = readFileSync(getSyncOwnerPath(lockDir), 'utf8')
  } catch {
    return { status: 'missing' }
  }
  return ownerReadOf(raw)
}

export interface PreemptMarker {
  pid: number
  kind: SyncSessionKind
  /** The lockNonce of the holder this marker was written for; a marker without one is honored by any holder. */
  target?: string
}

// Lock-content writes go tmp+rename: a concurrent reader never sees a torn
// owner or marker, only the previous whole file or the next whole file.
export async function writeLockFile(path: string, content: string): Promise<void> {
  const tmpPath = `${path}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`
  await writeFile(tmpPath, content, 'utf8')
  try {
    await rename(tmpPath, path)
  } catch (error) {
    await rm(tmpPath, { force: true })
    throw error
  }
}

// The victim's read of the killer's marker: who superseded it, or null when
// the SIGTERM came from anywhere else (plain kill, graceful watch shutdown).
// A kind-less marker reads as a sync newcomer, so half-written markers from
// an older writer still resolve to a superseder; a marker that names its target
// lets a holder ignore one left in its dir for somebody else.
export function readPreemptMarkerSync(lockDir: string): PreemptMarker | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(getSyncPreemptPath(lockDir), 'utf8')) as unknown
  } catch {
    return null
  }
  const record = (parsed ?? {}) as Record<string, unknown>
  if (!isLivePid(record.pid)) return null
  const marker: PreemptMarker = { pid: record.pid, kind: isSessionKind(record.kind) ? record.kind : 'one-shot' }
  if (isNonEmptyString(record.target)) marker.target = record.target
  return marker
}

/**
 * The watch-state file: what a resident watch tells a one-shot that pokes it
 * (SIGUSR2), written by the watch to `<lockDir>/watch-state.json`.
 *
 * - `pid` / `nonce`: the watch's own owner pid and lockNonce; a reader ignores
 *   a file that names anyone else, so a stale file never speaks for a new watch.
 * - `requested`: pokes taken so far. On each SIGUSR2 the watch increments it
 *   and writes the file BEFORE it schedules the resync, which is the ack.
 * - `done` / `failed`: `done` is the `requested` value the last finished resync
 *   STARTED from (read it when the pass begins, store it when the pass ends),
 *   and `failed` says whether that pass failed. A one-shot reads `requested`,
 *   pokes, and waits for `done` to reach one past what it read: that pass
 *   started after the poke, so it holds the one-shot's saved edit.
 * - `stopping`: written true before the graceful stop begins to settle; a
 *   one-shot then waits for the release and syncs itself.
 *
 * Publish the first state only once the SIGUSR2 listener is attached: a
 * one-shot reads the file's existence as "safe to poke". Writers should use
 * writeWatchStateSync from the poke handler, so two writes can never land out
 * of order; a rejected or thrown write (ENOENT while the generated folder is
 * gone) must not stop the watch from scheduling its resync.
 */
export interface WatchState {
  pid: number
  nonce: string
  requested: number
  done: number
  failed: boolean
  stopping: boolean
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

// The first state of a watch session: nothing requested, nothing done.
export function freshWatchState(owner: SyncSessionOwner): WatchState {
  return { pid: owner.pid, nonce: owner.lockNonce, requested: 0, done: 0, failed: false, stopping: false }
}

type WatchCounters = Pick<WatchState, 'requested' | 'done' | 'failed' | 'stopping'>

function readWatchCounters(candidate: Record<string, unknown>): WatchCounters | null {
  const { requested, done, failed, stopping } = candidate
  if (!isCount(requested) || !isCount(done)) return null
  if (typeof failed !== 'boolean' || typeof stopping !== 'boolean') return null
  return { requested, done, failed, stopping }
}

// Every field a waiting one-shot trusts is checked, so a torn or foreign file
// reads as no state at all instead of a wrong ack.
export function parseWatchState(value: unknown): WatchState | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>
  if (!isLivePid(candidate.pid) || !isNonEmptyString(candidate.nonce)) return null
  const counters = readWatchCounters(candidate)
  return counters === null ? null : { pid: candidate.pid, nonce: candidate.nonce, ...counters }
}

export async function readWatchState(lockDir: string): Promise<WatchState | null> {
  try {
    return parseWatchState(JSON.parse(await readFile(getWatchStatePath(lockDir), 'utf8')) as unknown)
  } catch {
    return null
  }
}

export async function writeWatchState(lockDir: string, state: WatchState): Promise<void> {
  await writeLockFile(getWatchStatePath(lockDir), JSON.stringify(state))
}

// The synchronous twin, for the poke handler: tmp+rename like writeLockFile,
// with no await between two writes, so a later state can never be overtaken.
export function writeWatchStateSync(lockDir: string, state: WatchState): void {
  const path = getWatchStatePath(lockDir)
  const tmpPath = `${path}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`
  writeFileSync(tmpPath, JSON.stringify(state), 'utf8')
  try {
    renameSync(tmpPath, path)
  } catch (error) {
    rmSync(tmpPath, { force: true })
    throw error
  }
}
