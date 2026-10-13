// Sync session claim: the mkdir race for the lock dir behind `ref sync`. It
// takes a lock dir plus the owner document a process wants to publish and emits
// whether that process now owns the dir: a fresh claim is one atomic mkdir, a
// takeover is a remove plus an mkdir that decides between racing takers, and both
// end by reading the owner file back, so a racer that replaced it reads as a lost
// race and never as a hold. The takeover's owner check and its remove run back to
// back with no await between them, and the filesystem errors that only a race can
// produce are named here so the acquire loop can treat them as lost races too.

import { existsSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { getSyncOwnerPath, readOwnerFile, readOwnerFileSync, writeLockFile, type OwnerRead, type SyncSessionOwner } from './session-owner.ts'

const MISSING_OWNER_SETTLES_MS = [100, 500]
const TAKE_SETTLE_MS = 50
const RM_RETRIES = 3
const RM_RETRY_DELAY_MS = 20

// What a lost race leaves behind: the dir vanished under a write (ENOENT,
// and EINVAL on macOS), another claimer won the mkdir (EEXIST), a racer's tmp
// file landed inside a dir being removed (ENOTEMPTY), or the OS held the entry
// a moment (EBUSY, EPERM on Windows). A permanent fault such as EACCES repeats
// on every attempt and is not in this set, so it fails loud at once.
const RACE_ERROR_CODES = new Set(['ENOENT', 'EEXIST', 'ENOTEMPTY', 'EINVAL', 'EBUSY', 'EPERM'])

export function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException)?.code
}

export function isRaceError(error: unknown): boolean {
  const code = errorCode(error)
  return code !== undefined && RACE_ERROR_CODES.has(code)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), ms)
  })
}

// A missing owner usually means the winner has not finished writing yet, so
// settle twice before treating the dir as a crashed acquire. A live writer
// lands within milliseconds; only a corpse stays missing.
export async function settleMissingOwner(lockDir: string): Promise<OwnerRead> {
  for (const waitMs of MISSING_OWNER_SETTLES_MS) {
    await sleep(waitMs)
    const again = await readOwnerFile(lockDir)
    if (again.status !== 'missing') return again
  }
  return { status: 'missing' }
}

async function ownerNonceMatches(lockDir: string, nonce: string): Promise<boolean> {
  const back = await readOwnerFile(lockDir)
  return back.status === 'ok' && back.owner.lockNonce === nonce
}

// The claimed dir still needs its owner file: a racer's rm can land between
// our mkdir and this write, which reads as retry (never as held). `onPublish`
// fires just before the write, since from then on a newcomer can read the owner
// and aim a kill at it.
async function writeFreshOwner(lockDir: string, mine: SyncSessionOwner, onPublish: () => void): Promise<boolean> {
  onPublish()
  try {
    await writeLockFile(getSyncOwnerPath(lockDir), JSON.stringify(mine))
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return false
    throw error
  }
  return ownerNonceMatches(lockDir, mine.lockNonce)
}

/** One atomic mkdir plus the owner write: true when this process now owns a fresh lock dir. */
export async function claimFreshLock(lockDir: string, mine: SyncSessionOwner, onPublish: () => void = () => {}): Promise<boolean> {
  try {
    await mkdir(lockDir)
  } catch (error) {
    if (errorCode(error) === 'EEXIST') return false
    throw error
  }
  return writeFreshOwner(lockDir, mine, onPublish)
}

// Remove the lock dir only while it still holds the owner the caller saw. A dir
// that is already gone (the victim of a kill leg frees its own lock before it
// exits) needs no remove at all, which keeps a late taker from wiping a fresh
// claim that landed after the victim let go. The read and the remove run back
// to back with no await between them, so a fresh claim can only be wiped by a
// racer that lands inside the gap between two syscalls, not across event-loop
// turns. The remove retries a racer's tmp file out of the way instead of
// failing on it.
function removeLockDirUnlessMoved(lockDir: string, lastSeen: SyncSessionOwner | null): boolean {
  if (!existsSync(lockDir)) return true
  if (lastSeen !== null) {
    const fresh = readOwnerFileSync(lockDir)
    if (fresh.status === 'ok' && fresh.owner.lockNonce !== lastSeen.lockNonce) return false
  }
  rmSync(lockDir, { recursive: true, force: true, maxRetries: RM_RETRIES, retryDelay: RM_RETRY_DELAY_MS })
  return true
}

/**
 * Steal the dir: bail when it changed hands since the caller read it, then
 * remove plus atomic mkdir decides between racing takers, and a settle re-read
 * closes the phantom double-hold window before the caller calls it held.
 */
export async function forceTake(
  lockDir: string,
  mine: SyncSessionOwner,
  lastSeen: SyncSessionOwner | null,
  onPublish: () => void = () => {},
): Promise<boolean> {
  if (!removeLockDirUnlessMoved(lockDir, lastSeen)) return false
  if (!(await claimFreshLock(lockDir, mine, onPublish))) return false
  await sleep(TAKE_SETTLE_MS)
  return ownerNonceMatches(lockDir, mine.lockNonce)
}
