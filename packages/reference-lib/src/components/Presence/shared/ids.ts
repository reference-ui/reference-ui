/**
 * Monotonic Presence instance ids. `nextPresenceId` hands the
 * `usePresence` hook a unique `presence-N` token per mount so nested and
 * coordinated exits can register, report, and unregister without colliding.
 * A module counter is enough: ids only need uniqueness within a document,
 * never stability across renders or servers.
 */

let presenceIdCounter = 0

export function nextPresenceId(): string {
  return `presence-${++presenceIdCounter}`
}
