import { subscribe } from '@parcel/watcher'
import { existsSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { SESSION_FILE } from './files'

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

  async function watchOutDir(generation: number): Promise<void> {
    try {
      const subscription = await subscribe(outDir, (error, events) => {
        if (error) return

        for (const event of events) {
          if (basename(event.path) !== SESSION_FILE) continue
          onSessionChange()
          return
        }
      })

      bindWatcher(subscription, generation)
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
      onSessionChange()
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