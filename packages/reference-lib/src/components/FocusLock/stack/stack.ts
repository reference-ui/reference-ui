/**
 * Nested-lock arbitration: the last-active-wins stack that pauses lower
 * locks while a nested lock is top. registerLock and unregisterLock bracket
 * one lock's active window, locksForDocument scopes the stack to a single
 * Document (pruning detached containers on every read), and isTopLock tells
 * a lock whether it is the sole live reclaimer.
 */
import type * as React from 'react'

export type LockEntry = {
  id: string
  container: HTMLElement
  shards: () => HTMLElement[]
  lastFocusedNode: React.MutableRefObject<HTMLElement | null>
}

const activeLocks: LockEntry[] = []

function pruneLocks() {
  for (let i = activeLocks.length - 1; i >= 0; i--) {
    if (!activeLocks[i].container.isConnected) {
      activeLocks.splice(i, 1)
    }
  }
}

export function registerLock(entry: LockEntry): void {
  activeLocks.push(entry)
}

export function unregisterLock(lockId: string): void {
  const index = activeLocks.findIndex(lock => lock.id === lockId)
  if (index !== -1) {
    activeLocks.splice(index, 1)
  }
}

export function locksForDocument(doc: Document): LockEntry[] {
  pruneLocks()
  return activeLocks.filter(lock => lock.container.ownerDocument === doc)
}

export function isTopLock(lockId: string, doc: Document): boolean {
  const live = locksForDocument(doc)
  return live[live.length - 1]?.id === lockId
}
