// Sync watch: the file watcher behind `ref sync --watch`.
// It takes a project root plus callbacks and emits a handle whose stop() ends the session and whose baseline carries the first sync's result.
// The watcher subscribes before the baseline, so an edit made during the boot is buffered and resynced once the baseline lands.
// Matched events, and directory events that can carry matches in or out of scope, settle through a debounced, max-wait-capped trailing edge into one serial sync() (scheduler.ts), over the engine's own scope (classify.ts, match.ts, scope.ts).
// A stat-poll backstop (poll.ts) schedules the same resync when OS events lag or drop, as saturated macOS FSEvents does.
// The session holds the sync lock for its life, re-asserts it if the generated folder is deleted under it, and publishes the handshake a one-shot poke reads (handshake.ts).

import { resolve } from 'node:path'
import { subscribe, type AsyncSubscription } from '@parcel/watcher'
import { loadUserConfigWithDependencies, type LoadedUserConfig } from '../../config/load.ts'
import { sync, type SyncOptions, type SyncResult } from '../../sync/index.ts'
import { getSyncLockDir } from '../../sync/session-owner.ts'
import { acquireSyncSession, reassertHeldSession, type SyncSession } from '../../sync/session.ts'
import { reportDrift, type ClassifyState, type WatchChange } from './classify.ts'
import { createParcelHandler, createWatcherErrorHandler, toError, type ResyncTriggers } from './handler.ts'
import { createWatchStatePublisher, type WatchStatePublisher } from './handshake.ts'
import { canonicalPath, ENGINE_IGNORE_GLOBS } from './match.ts'
import { createPassClock, startPollBackstop, type PassClock, type PollBackstop } from './poll.ts'
import { createResyncScheduler, type ResyncScheduler } from './scheduler.ts'
import { deriveScope, pollTargets, refreshTriggerScope, unsubscribeAll, type TriggerScope } from './scope.ts'

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

// The lock guard's tick: a one-shot that meets a deleted generated folder
// reads the lock as free, so the watch re-asserts within one tick.
const LOCK_REASSERT_MS = 100

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

// Re-asserts the watch's lock on a short tick, so a generated folder deleted
// under the watch cannot leave a one-shot free to claim the project. Passes do
// not overlap, a streak of failures reports once, and the returned stop waits
// out a pass already in flight.
function startLockGuard(reassert: () => Promise<void>, report: (error: Error) => void): () => Promise<void> {
  let pass: Promise<void> | null = null
  let failing = false
  const runPass = async (): Promise<void> => {
    try {
      await reassert()
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

// What one watch run is built from: the project, its loaded config and held
// session, and the caller's sinks and options.
interface WatchSetup {
  projectRoot: string
  loaded: LoadedUserConfig
  session: SyncSession
  callbacks: WatchCallbacks
  options: WatchSyncOptions
}

// The flags a run's triggers, resync passes and stop path share. `live` turns
// true once the baseline has landed; until then a trigger only records what it
// asked for in `pending`, and the baseline's end flushes those as one pass.
interface RunFlags {
  stopped: boolean
  live: boolean
  pending: { schedule: boolean; request: boolean }
}

// Everything one resync pass reads from its run.
interface PassEnv {
  projectRoot: string
  reporting: SyncOptions
  report: (error: Error) => void
  callbacks: WatchCallbacks
  handshake: WatchStatePublisher
  scope: TriggerScope
  flags: RunFlags
  triggers: ResyncTriggers
  reassert: () => Promise<void>
}

// The gate every watch trigger passes: live triggers reach the scheduler, and
// early ones are recorded for the flush. The scheduler is read lazily because
// it is built from the pass, which is built from the gate.
function gateTriggers(flags: RunFlags, scheduler: () => ResyncScheduler): ResyncTriggers {
  return {
    schedule: () => {
      if (flags.live) scheduler().schedule()
      else flags.pending.schedule = true
    },
    request: () => {
      if (flags.live) scheduler().request()
      else flags.pending.request = true
    },
  }
}

// A scope rebuild that throws reports and keeps the watch on the scope it has:
// a throw here must never take the parcel callback down.
async function rebuildScope(env: PassEnv, widen: boolean): Promise<boolean> {
  try {
    return await refreshTriggerScope(env.scope, widen)
  } catch (error) {
    env.report(toError(error))
    return false
  }
}

async function notifyResync(env: PassEnv, result: SyncResult): Promise<void> {
  try {
    await env.callbacks.onResync?.(result)
  } catch (error) {
    env.report(toError(error))
  }
}

// One sync attempt behind the lock re-assert: resolves the result, or the error it failed with.
async function attemptSync(env: PassEnv): Promise<SyncResult | Error> {
  try {
    await env.reassert()
    return await stampedSync(env.projectRoot, env.reporting)
  } catch (error) {
    return toError(error)
  }
}

// One resync: record where the pass starts and how it ends for the handshake,
// then rebuild the scope from the config that sync loaded. A failed sync widens
// the scope and reports; a root the rebuild newly subscribed gets one catch-up
// sync, since its edits between the sync's reads and that subscription were
// never delivered.
async function resyncPass(env: PassEnv): Promise<void> {
  if (env.flags.stopped) return
  const started = env.handshake.passStarted()
  const outcome = await attemptSync(env)
  const failed = outcome instanceof Error
  env.handshake.passFinished(started, failed)
  const catchUp = env.flags.stopped ? false : await rebuildScope(env, failed)
  if (env.flags.stopped) return
  if (outcome instanceof Error) env.report(outcome)
  else await notifyResync(env, outcome)
  if (catchUp && !env.flags.stopped) env.triggers.schedule()
}

interface WatchRun {
  onPoke: () => void
  start: () => Promise<WatchHandle>
  abort: () => Promise<void>
}

// What the trigger scope of one run is built from: the initial scope, the roots and the sinks it reports to.
interface TriggerScopeSetup {
  projectRoot: string
  watchRoot: string
  initial: ReturnType<typeof deriveScope>
  subscriptions: Map<string, AsyncSubscription>
  triggers: ResyncTriggers
  report: (error: Error) => void
  callbacks: WatchCallbacks
  clock: PassClock
}

// The classifier state and the trigger scope one run shares. The parcel handler feeds the
// triggers; the scope records the subscriptions and the roots the watcher currently covers.
function createTriggerScope(setup: TriggerScopeSetup): TriggerScope {
  const { projectRoot, watchRoot, initial, subscriptions, triggers, report, callbacks, clock } = setup
  const state: ClassifyState = {
    watchRoot,
    isMatch: initial.isMatch,
    dependencyFiles: initial.dependencyFiles,
    snapshot: initial.snapshot,
  }
  const onEvent = createParcelHandler(state, {
    onChange: (change) => callbacks.onChange?.(change),
    triggers,
    reportError: createWatcherErrorHandler(report, triggers),
    wasRead: clock.wasRead,
  })
  return { projectRoot, watchRoot, state, subscriptions, onEvent, report, currentRoots: initial.roots }
}

// One watch run: the scope, the scheduler, the handshake, and the boot and stop
// paths. The scope is subscribed before the baseline, and the baseline's end
// flushes whatever triggers arrived while it ran.
function createWatchRun(setup: WatchSetup): WatchRun {
  const { projectRoot, loaded, session, callbacks, options } = setup
  const report = (error: Error): void => callbacks.onError?.(error)
  const watchRoot = canonicalPath(projectRoot)
  const initial = deriveScope(watchRoot, loaded)
  const subscriptions = new Map<string, AsyncSubscription>()
  const flags: RunFlags = { stopped: false, live: false, pending: { schedule: false, request: false } }
  const handshake = createWatchStatePublisher(getSyncLockDir(projectRoot), session.owner, report)
  let stopGuard: () => Promise<void> = async () => {}
  let poll: PollBackstop | null = null
  const triggers = gateTriggers(flags, () => scheduler)
  // When the latest pass (the baseline included) started: an event for a write before it needs no resync.
  const clock = createPassClock()
  const scope = createTriggerScope({ projectRoot, watchRoot, initial, subscriptions, triggers, report, callbacks, clock })
  // Re-asserting a vanished lock dir recreates the owner, not the watch-state
  // file, so the counters are published again once the owner is back.
  const reassert = async (): Promise<void> => {
    if (await reassertHeldSession(projectRoot)) handshake.publish()
  }
  const env: PassEnv = {
    projectRoot,
    reporting: reportingOf(options),
    report,
    callbacks,
    handshake,
    scope,
    flags,
    triggers,
    reassert,
  }
  // A pass reads every drift the poll has seen, so its start settles them.
  const scheduler: ResyncScheduler = createResyncScheduler(() => {
    clock.started()
    poll?.settled()
    return resyncPass(env)
  })

  // The poke is published before its resync is scheduled: a one-shot that
  // reads the new count knows the watch has taken its request.
  const onPoke = (): void => {
    if (flags.stopped) return
    handshake.poke()
    triggers.request()
  }

  // Stopping is published before anything settles, so a one-shot that pokes
  // during the shutdown syncs itself instead of waiting on a pass that is coming.
  async function teardown(): Promise<void> {
    flags.stopped = true
    handshake.stopping()
    poll?.stop()
    await stopGuard()
    await scheduler.settle()
    await unsubscribeAll(subscriptions)
    session.release()
    process.removeListener('SIGUSR2', onPoke)
  }

  // The boot state goes out once the poke listener is attached (watchSync does
  // that before start), so a one-shot reads the file's existence as "safe to poke".
  async function start(): Promise<WatchHandle> {
    handshake.publish()
    stopGuard = startLockGuard(reassert, report)
    for (const root of scope.currentRoots) {
      subscriptions.set(root, await subscribe(root, scope.onEvent, { ignore: ENGINE_IGNORE_GLOBS }))
    }
    clock.started()
    const baseline = await stampedSync(projectRoot, env.reporting)
    const catchUp = await rebuildScope(env, false)
    flags.live = true
    const onDrift = (drifted: Map<string, string>) => reportDrift(drifted, scope.state, (change) => callbacks.onChange?.(change))
    poll = startPollBackstop(() => pollTargets(scope), { onDrift, onStale: triggers.schedule }, { clock })
    if (flags.pending.request) scheduler.request()
    else if (flags.pending.schedule || catchUp) scheduler.schedule()
    return { stop: teardown, baseline }
  }

  return { onPoke, start, abort: teardown }
}

/**
 * Watch the project at cwd: hold the sync session lock, subscribe, run one
 * baseline sync, then resync on every matched add/change/unlink until stop().
 * Resyncs debounce to a trailing edge, capped by max-wait, and serialize
 * behind the in-flight sync, so a burst of saves costs one rebuild; a failing
 * resync reports through onError, widens the watched scope, and keeps watching.
 * onResync fires only for watch-driven resyncs, never the baseline. A SIGUSR2
 * poke (a one-shot meeting the session) resyncs now. Resolves with the handle
 * plus the baseline result once the baseline has landed.
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
  let run: WatchRun | null = null
  try {
    run = createWatchRun({ projectRoot, loaded, session, callbacks, options })
    process.on('SIGUSR2', run.onPoke)
    return await run.start()
  } catch (error) {
    if (run !== null) await run.abort()
    else session.release()
    throw error
  }
}
