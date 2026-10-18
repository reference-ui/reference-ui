// Lock takeover probe for the staged commit. It takes the lock dir and this
// session's lock nonce, and emits whether another session holds the lock now.
// A missing owner is not a takeover, since a racer's rewrite lands within
// milliseconds; a readable owner with a foreign nonce, or one that will not
// parse, counts as taken.

import { readFileSync } from 'node:fs'
import { getSyncOwnerPath, parseSyncSessionOwner } from './session-owner.ts'

/** True when the lock dir's owner document names another session, or cannot be read as an owner. */
export function lockTakenByOther(lockDir: string, lockNonce: string): boolean {
  let raw: string
  try {
    raw = readFileSync(getSyncOwnerPath(lockDir), 'utf8')
  } catch {
    return false
  }
  try {
    const owner = parseSyncSessionOwner(JSON.parse(raw) as unknown)
    return owner === null || owner.lockNonce !== lockNonce
  } catch {
    return true
  }
}
