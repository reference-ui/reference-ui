/**
 * Lock identity for the nesting stack. nextLockId hands out the next
 * `lock-N` token; each FocusLock session claims one at first render and
 * keeps it for life so stack registration and top-lock checks can name it.
 */

let lockIdCounter = 0

export function nextLockId(): string {
  lockIdCounter += 1
  return `lock-${lockIdCounter}`
}
