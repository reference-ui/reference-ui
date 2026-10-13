// Sync watch: the file watcher behind `ref sync --watch`.
// It takes a project root plus callbacks and emits a handle whose stop() ends
// the session and whose baseline carries the first sync's result. Every matched
// add/change/unlink, and every directory event that can carry matches in or out
// of scope, settles through a trailing-edge debounce with a max-wait ceiling
// (scheduler.ts), so a steady stream of saves still resyncs. Each settled burst
// is one serial sync(). Scope is the engine's own: the config include globs, the
// config file's dependencies, and the real targets of symlinked matches, minus
// the engine's ignored directories (match.ts, classify.ts). The session holds the
// sync lock for its life, re-asserts it if the generated folder is deleted under
// it, and a SIGUSR2 poke resyncs now.

import { dirname, resolve } from 'node:path'
import { subscribe, type AsyncSubscription, type Event as ParcelEvent } from '@parcel/watcher'
import { getLastLoadedUserConfig, loadUserConfigWithDependencies, type LoadedUserConfig } from '../../config/load.ts'
import { sync, type SyncOptions, type SyncResult } from '../../sync/index.ts'
import { acquireSyncSession, reassertHeldSession } from '../../sync/session.ts'
import { classifyEvent, type ClassifyState, type WatchChange } from './classify.ts'
import {
  canonicalPath,
  createIncludeMatcher,
  deriveWatchRoots,
  diffWatchRoots,
  ENGINE_IGNORE_GLOBS,
  scanMatches,
  type IncludeMatcher,
  type MatchSnapshot,
} from './match.ts'
import { createResyncScheduler } from './scheduler.ts'

export type { WatchChange, WatchEvent } from './classify.ts'
export { deriveWatchRoots } from './match.ts'

export interface WatchCallbacks {
  onChange?: (change: WatchChange) => void
  onResync?: (result: SyncResult) => void
  onError?: (error: Error) => void
}

export interface WatchHandle {
  stop(): Promise<void>
  /** The baseline sync's result: the boot line prints its elapsed wall and folds its warning count. */
  baseline: SyncResult
}

const ERROR_RESYNC_COOLDOWN_MS = 5000
// The lock guard's tick: a one-shot that meets a deleted generated folder
// reads the lock as free, so the watch re-asserts within one tick.
const LOCK_REASSERT_MS = 100

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

// Watcher errors resync after a cooldown so a flapping backend cannot
// self-perpetuate; dropped OS event buffers stay quiet because the
// watcher keeps delivering real events without a rebuild storm.
function createWatcherErrorHandler(report: (error: Error) => void, resync: () => void): (error: Error) => void {
  let lastErrorResync = 0
  return (error: Error) => {
    if (isDroppedEventsError(error)) return
    report(error)
    const now = Date.now()
    if (now - lastErrorResync < ERROR_RESYNC_COOLDOWN_MS) return
    lastErrorResync = now
    resync()
  }
}

function isDroppedEventsError(error: Error): boolean {
  return error.message.includes('Events were dropped')
}

type ParcelHandler = (error: Error | null, events: ParcelEvent[]) => void

// One parcel callback over every root: classified events report through
// onChange and jointly schedule one debounced resync per burst.
function createParcelHandler(
  state: ClassifyState,
  callbacks: WatchCallbacks,
  schedule: () => void,
  reportError: (error: Error) => void,
): ParcelHandler {
  return (error: Error | null, events: ParcelEvent[]) => {
    if (error) {
      reportError(toError(error))
      return
    }
    let matched = false
    for (const event of events) {
      const change = classifyEvent(event, state)
      if (!change) continue
      matched = true
      callbacks.onChange?.(change)
    }
    if (matched) schedule()
  }
}

// The scope one loaded config implies: the matcher, the dependency files, the
// match snapshot, and the roots to subscribe, with symlink target dirs folded in.
interface WatchScope {
  isMatch: IncludeMatcher
  dependencyFiles: Set<string>
  snapshot: MatchSnapshot
  roots: string[]
}

function deriveScope(watchRoot: string, loaded: LoadedUserConfig): WatchScope {
  const include = loaded.config.include
  const dependencyFiles = new Set(loaded.dependencyPaths.map((entry) => canonicalPath(entry)))
  const snapshot = scanMatches(watchRoot, include)
  const extraDirs = [...[...dependencyFiles].map((file) => dirname(file)), ...snapshot.linkDirs]
  return {
    isMatch: createIncludeMatcher(include),
    dependencyFiles,
    snapshot,
    roots: deriveWatchRoots(watchRoot, include, extraDirs),
  }
}

// Mutable trigger-scope handle the resync rebuild writes through: the state the
// parcel handler closes over, the owning roots, and the live subscriptions.
interface TriggerScope {
  projectRoot: string
  watchRoot: string
  state: ClassifyState
  currentRoots: string[]
  subscriptions: Map<string, AsyncSubscription>
  onParcelEvent: ParcelHandler
}

// The resync-path trigger rebuild: after the compile's fresh load, the matcher,
// dependency files, match snapshot, and parcel subscriptions follow the same
// loaded config the compile used — one load, never two. Roots diff so an
// unchanged set churns no subscription.
async function refreshTriggerScope(scope: TriggerScope): Promise<void> {
  const resyncLoaded = getLastLoadedUserConfig(scope.projectRoot)
  if (resyncLoaded === undefined) return
  const next = deriveScope(scope.watchRoot, resyncLoaded)
  scope.state.isMatch = next.isMatch
  scope.state.dependencyFiles = next.dependencyFiles
  scope.state.snapshot = next.snapshot
  const { added, removed } = diffWatchRoots(scope.currentRoots, next.roots)
  for (const root of removed) {
    const subscription = scope.subscriptions.get(root)
    scope.subscriptions.delete(root)
    if (subscription !== undefined) await subscription.unsubscribe()
  }
  for (const root of added) {
    scope.subscriptions.set(root, await subscribe(root, scope.onParcelEvent, { ignore: ENGINE_IGNORE_GLOBS }))
  }
  scope.currentRoots = next.roots
}

// Re-asserts the watch's lock on a short tick, so a generated folder deleted
// under the watch cannot leave a one-shot free to claim the project. Passes do
// not overlap, a streak of failures reports once, and the returned stop waits
// out a pass already in flight.
function startLockGuard(projectRoot: string, report: (error: Error) => void): () => Promise<void> {
  let pass: Promise<void> | null = null
  let failing = false
  const runPass = async (): Promise<void> => {
    try {
      await reassertHeldSession(projectRoot)
      failing = false
    } catch (error) {
      if (!failing) report(toError(error))
      failing = true
    } finally {
      pass = null
    }
  }
  const timer = setInterval(() => {
    if (pass === null) pass = runPass()
  }, LOCK_REASSERT_MS)
  timer.unref()
  return async () => {
    clearInterval(timer)
    if (pass !== null) await pass
  }
}

async function unsubscribeAll(subscriptions: Map<string, AsyncSubscription>): Promise<void> {
  await Promise.all([...subscriptions.values()].map(async (subscription) => {
    try {
      await subscription.unsubscribe()
    } catch {
      // Teardown races the backend; a failed unsubscribe is already gone.
    }
  }))
}

export interface WatchSyncOptions {
  breakLock?: boolean
  verbose?: boolean
  /**
   * Machine-readable session: threaded into every baseline and resync so
   * the tasty phase reports JSON. Threaded from `ref sync --watch --json`.
   */
  json?: boolean
  /**
   * Fold every tasty landing silent (baseline plus any resync retry)
   * instead of letting it report its own summary line. Set it only
   * with a drain: the watch runner drains each landing and carries
   * its count into its own line; undrained callers leave it unset so
   * no warning is lost.
   */
  foldRefDiagnostics?: boolean
}

function reportingOf(options: WatchSyncOptions): SyncOptions {
  return {
    verbose: options.verbose ?? false,
    json: options.json ?? false,
    foldRefDiagnostics: options.foldRefDiagnostics ?? false,
  }
}

// Time one driver sync and stamp its wall: the boot block and the resync
// one-liner both print the stamped wall, never the runner's. Baseline and
// resync share it so their reporting cannot drift apart.
async function stampedSync(projectRoot: string, reporting: SyncOptions): Promise<SyncResult> {
  const start = Date.now()
  const result = await sync(projectRoot, reporting)
  result.elapsedMs = Date.now() - start
  return result
}

/**
 * Watch the project at cwd: hold the sync session lock, run one baseline
 * sync, then resync on every matched add/change/unlink until stop().
 * Resyncs debounce to a trailing edge, capped by max-wait, and serialize
 * behind the in-flight sync, so a burst of saves costs one rebuild; a failing
 * resync reports through onError and keeps watching. onResync fires only for
 * watch-driven resyncs, never the baseline. A SIGUSR2 poke (a one-shot meeting
 * the session) resyncs now. Resolves with the handle plus the baseline result
 * once the subscriptions are attached.
 */
export async function watchSync(cwd: string, callbacks: WatchCallbacks = {}, options: WatchSyncOptions = {}): Promise<WatchHandle> {
  const projectRoot = resolve(cwd)
  const loaded = await loadUserConfigWithDependencies(projectRoot)
  const session = await acquireSyncSession({
    cwd: projectRoot,
    kind: 'watch',
    breakLock: options.breakLock ?? false,
    json: options.json ?? false,
  })
  let stopped = false
  // A poke during the baseline queues instead of racing it: the early poke
  // only records, and the live target drains the flag once attached. Once
  // stop() begins, a poke is ignored, and the listener outlives the release.
  let pokeRequested = false
  let pokeTarget: () => void = () => { pokeRequested = true }
  const onPoke = (): void => {
    if (!stopped) pokeTarget()
  }
  process.on('SIGUSR2', onPoke)
  let stopGuard: () => Promise<void> = async () => {}
  try {
    stopGuard = startLockGuard(projectRoot, (error) => callbacks.onError?.(error))
    const baseline = await stampedSync(projectRoot, reportingOf(options))

    const watchRoot = canonicalPath(projectRoot)
    const initial = deriveScope(watchRoot, loaded)
    const state: ClassifyState = {
      watchRoot,
      isMatch: initial.isMatch,
      dependencyFiles: initial.dependencyFiles,
      snapshot: initial.snapshot,
    }
    const subscriptions = new Map<string, AsyncSubscription>()

    const scheduler = createResyncScheduler(async () => {
      try {
        await reassertHeldSession(projectRoot)
        const result = await stampedSync(projectRoot, reportingOf(options))
        if (!stopped) {
          await refreshTriggerScope(scope)
          await callbacks.onResync?.(result)
        }
      } catch (error) {
        if (!stopped) callbacks.onError?.(toError(error))
      }
    })
    pokeTarget = () => { scheduler.request() }
    const reportError = createWatcherErrorHandler(
      (error) => callbacks.onError?.(error),
      () => scheduler.request(),
    )
    const onParcelEvent = createParcelHandler(state, callbacks, () => scheduler.schedule(), reportError)
    const scope: TriggerScope = { projectRoot, watchRoot, state, currentRoots: initial.roots, subscriptions, onParcelEvent }

    for (const root of scope.currentRoots) {
      subscriptions.set(root, await subscribe(root, onParcelEvent, { ignore: ENGINE_IGNORE_GLOBS }))
    }
    if (pokeRequested) scheduler.request()

    async function stop(): Promise<void> {
      stopped = true
      await stopGuard()
      await scheduler.settle()
      await unsubscribeAll(subscriptions)
      session.release()
      process.removeListener('SIGUSR2', onPoke)
    }

    return { stop, baseline }
  } catch (error) {
    stopped = true
    await stopGuard()
    session.release()
    process.removeListener('SIGUSR2', onPoke)
    throw error
  }
}
