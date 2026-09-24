// Sync session owner: the lock-dir document model behind `ref sync`.
// It takes lock-dir paths and emits validated owners, owner reads, and the
// exit-path messages. The acquire engine in session.ts owns the mkdir race,
// the preempt matrix, and the hold; this module owns what the lock dir
// means on disk.

import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getOutDirPath } from '../lib/paths/index.ts'

export type SyncSessionKind = 'one-shot' | 'watch' | 'clean'

export interface SyncSessionOwner {
  pid: number
  lockNonce: string
  kind: SyncSessionKind
  argv: string[]
  startedAt: string
}

export type OwnerRead =
  | { status: 'ok'; owner: SyncSessionOwner }
  | { status: 'missing' }
  | { status: 'malformed' }

export const SYNC_LOCK_DIR_NAME = 'sync.lock'
export const SUPERSEDED_EXIT_CODE = 75

const OWNER_FILE = 'owner.json'
const PREEMPT_FILE = 'preempt.json'

export function getSyncLockDir(cwd: string): string {
  return join(getOutDirPath(cwd), SYNC_LOCK_DIR_NAME)
}

export function getSyncOwnerPath(lockDir: string): string {
  return join(lockDir, OWNER_FILE)
}

export function getSyncPreemptPath(lockDir: string): string {
  return join(lockDir, PREEMPT_FILE)
}

export function coveredByWatchMessage(watchPid: number): string {
  return `[ref] sync covered by watch session pid ${watchPid}`
}

export function supersededMessage(newcomerPid: number, newcomerKind: SyncSessionKind = 'one-shot'): string {
  return `[ref] sync superseded by ${lockActorTag(newcomerKind)} pid ${newcomerPid}`
}

export function throwSupersedeSignalError(holder: SyncSessionOwner, code: string | undefined): never {
  throw new Error(`[ref] sync: cannot supersede ${lockActorTag(holder.kind)} pid ${holder.pid} (${code ?? 'signal failed'})`)
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

// Owner validation: every field the takeover path trusts is checked, so a
// torn write or a foreign file reads as malformed (stale) instead of a kill
// target. argv/startedAt are forensic only and degrade to empties.
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
    argv: Array.isArray(candidate.argv)
      ? candidate.argv.filter((entry): entry is string => typeof entry === 'string')
      : [],
    startedAt: typeof candidate.startedAt === 'string' ? candidate.startedAt : '',
  }
}

export async function readOwnerFile(lockDir: string): Promise<OwnerRead> {
  let raw: string
  try {
    raw = await readFile(getSyncOwnerPath(lockDir), 'utf8')
  } catch {
    return { status: 'missing' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { status: 'malformed' }
  }
  const owner = parseSyncSessionOwner(parsed)
  return owner === null ? { status: 'malformed' } : { status: 'ok', owner }
}

export interface PreemptMarker {
  pid: number
  kind: SyncSessionKind
}

// The victim's read of the killer's marker: who superseded it, or null when
// the SIGTERM came from anywhere else (plain kill, graceful watch shutdown).
// A kind-less marker reads as a sync newcomer, so half-written markers from
// an older writer still resolve to a superseder.
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

export function readPreemptMarkerSync(lockDir: string): PreemptMarker | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(getSyncPreemptPath(lockDir), 'utf8')) as unknown
  } catch {
    return null
  }
  const pid = (parsed as Record<string, unknown>)?.pid
  if (!isLivePid(pid)) return null
  const kind = (parsed as Record<string, unknown>)?.kind
  return { pid, kind: isSessionKind(kind) ? kind : 'one-shot' }
}
