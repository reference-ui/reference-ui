// Watch side of the covered handshake: the watch-state file a one-shot poke reads
// to learn whether its poke was served. It takes the lock dir, the held owner, and
// the report sink, and emits a publisher whose counters the watch moves: each
// SIGUSR2 poke, each resync pass (where it started, how it finished), and the
// graceful stop. Every write is synchronous, so two publishes can never land out
// of order, and it runs only while the lock dir still names this watch: a publish
// never lands in a dir another session owns. A write that fails because the
// generated folder is gone is the re-assert's to repair, so it reports nothing.

import { readFileSync } from 'node:fs'
import {
  freshWatchState,
  getSyncOwnerPath,
  parseSyncSessionOwner,
  writeWatchStateSync,
  type SyncSessionOwner,
  type WatchState,
} from '../../sync/session-owner.ts'

export interface WatchStatePublisher {
  /** One more SIGUSR2 poke taken: `requested` moves and is published before the resync is scheduled. */
  poke(): void
  /** The `requested` count a resync pass starts from; read it when the pass begins. */
  passStarted(): number
  /** A pass finished: `done` takes the count it started from, and `failed` says whether it failed. */
  passFinished(started: number, failed: boolean): void
  /** The graceful stop has begun: `stopping` is published before anything settles. */
  stopping(): void
  /** Publishes the counters as they stand: the boot state, and the state again after a re-assert. */
  publish(): void
}

// The lock dir names this watch's owner: a missing, unreadable or foreign owner
// means the dir is not ours to write into.
function ownsLockDir(lockDir: string, nonce: string): boolean {
  try {
    const owner = parseSyncSessionOwner(JSON.parse(readFileSync(getSyncOwnerPath(lockDir), 'utf8')) as unknown)
    return owner?.lockNonce === nonce
  } catch {
    return false
  }
}

export function createWatchStatePublisher(
  lockDir: string,
  owner: SyncSessionOwner,
  report: (error: Error) => void,
): WatchStatePublisher {
  const state: WatchState = freshWatchState(owner)
  const publish = (): void => {
    if (!ownsLockDir(lockDir, owner.lockNonce)) return
    try {
      writeWatchStateSync(lockDir, state)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      report(error instanceof Error ? error : new Error(String(error)))
    }
  }
  return {
    poke() {
      state.requested += 1
      publish()
    },
    passStarted: () => state.requested,
    passFinished(started, failed) {
      state.done = started
      state.failed = failed
      publish()
    },
    stopping() {
      state.stopping = true
      publish()
    },
    publish,
  }
}
