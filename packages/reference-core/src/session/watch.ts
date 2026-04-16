import { subscribe } from '@parcel/watcher'
import { existsSync } from 'node:fs'
import { basename, dirname } from 'node:path'

type ParcelSubscription = Awaited<ReturnType<typeof subscribe>>

export interface SessionWatcher {
  restart(): void
  dispose(): void
}

/**
 * Keep the session watcher wiring isolated from the public API surface.
 * `public.ts` only cares about "start watching this outDir and notify me when
 * session.json changes"; the async Parcel subscription lifecycle lives here.
 */
export function createSessionWatcher(
  outDir: string,
  onSessionChange: () => void,
): SessionWatcher {
  let watcher: ParcelSubscription | null = null
  let watchGeneration = 0
  let disposed = false

  function stopWatcher(subscription: ParcelSubscription | null): void {
    if (!subscription) return

    try {
      const unsubscribeResult = subscription.unsubscribe()
      unsubscribeResult.catch(() => {})
    } catch {
      // Ignore unsubscribe errors during teardown.
    }
  }

  function bindWatcher(subscription: ParcelSubscription, generation: number): void {
    if (disposed || generation !== watchGeneration) {
      stopWatcher(subscription)
      return
    }

    watcher = subscription
  }

  function reconcileCurrentState(): void {
    onSessionChange()
  }

  async function watchOutDir(generation: number): Promise<void> {
    try {
      const subscription = await subscribe(outDir, (error, events) => {
        if (error) return

        if (events.length === 0) return

        // Atomic tmp-file + rename writes do not report identical event paths on
        // every platform. Reconcile on any directory change and let the manifest
        // reader decide whether a logical ready transition occurred.
        reconcileCurrentState()
      })

      bindWatcher(subscription, generation)

      // Subscribe is async. Reconcile once the watcher is actually attached so
      // a ready manifest written during startup is not missed on CI/Linux.
      reconcileCurrentState()
    } catch {
      // outDir may have been removed (e.g. ref clean); nothing to do.
    }
  }

  async function watchParentForOutDir(generation: number): Promise<void> {
    const parent = dirname(outDir)
    const outDirName = basename(outDir)

    if (!existsSync(parent)) return

    try {
      const subscription = await subscribe(parent, (error, events) => {
        if (error || !existsSync(outDir)) return

        for (const event of events) {
          if (basename(event.path) !== outDirName) continue
          restart()
          return
        }
      })

      bindWatcher(subscription, generation)

      if (existsSync(outDir)) restart()
    } catch {
      // Parent may not be watchable; ignore.
    }
  }

  function restart(): void {
    const previousWatcher = watcher
    watcher = null
    stopWatcher(previousWatcher)
    watchGeneration += 1
    const generation = watchGeneration

    if (existsSync(outDir)) {
      void watchOutDir(generation)

      // Surface the current manifest state immediately when the outDir already
      // exists instead of waiting for the next file-system event.
      reconcileCurrentState()
      return
    }

    void watchParentForOutDir(generation)
  }

  function dispose(): void {
    disposed = true
    stopWatcher(watcher)
    watcher = null
  }

  return {
    restart,
    dispose,
  }
}