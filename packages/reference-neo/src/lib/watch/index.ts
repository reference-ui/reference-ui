// Sync watch: the file watcher behind `ref sync --watch`.
// It takes a project root plus callbacks and emits a handle whose stop()
// ends the session and whose baseline carries the first sync's result.
// Every matched add/change/unlink settles through a trailing-edge debounce
// into one serial sync(), so discovery, alignment, and deletion all ride
// the same full resync. Scope is the config include globs plus the config
// file's own dependencies; node_modules, the generated folder, git
// internals, and gitignored paths never emit. The session holds the sync
// lock for its life; a SIGUSR2 poke resyncs now.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { subscribe, type AsyncSubscription, type Event as ParcelEvent } from '@parcel/watcher'
import picomatch from 'picomatch'
import { getLastLoadedUserConfig, loadUserConfigWithDependencies } from '../../config/load.ts'
import { sync, type SyncOptions, type SyncResult } from '../../sync/index.ts'
import { acquireSyncSession } from '../../sync/session.ts'

export type WatchEvent = 'add' | 'change' | 'unlink'

export interface WatchChange {
  event: WatchEvent
  path: string
  relativePath: string
}

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

const EVENT_MAP = {
  create: 'add',
  update: 'change',
  delete: 'unlink',
} as const

const RESYNC_SETTLE_MS = 60
const ERROR_RESYNC_COOLDOWN_MS = 5000
const GLOB_MAGIC = /[*?[\]{}()!]/
const STATIC_IGNORE = ['**/node_modules/**', '**/.reference-ui/**', '**/.git/**']

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function normalizePattern(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\/+/, '').replace(/^\/+/, '')
}

// The leading static directories of one include glob: `theme/**` watches
// `theme`. A pattern with no static head watches the project root.
function staticPrefix(pattern: string): string | undefined {
  const prefix: string[] = []
  for (const segment of normalizePattern(pattern.trim()).split('/').filter(Boolean)) {
    if (GLOB_MAGIC.test(segment)) break
    prefix.push(segment)
  }
  return prefix.length > 0 ? prefix.join('/') : undefined
}

function isUnder(parent: string, candidate: string): boolean {
  const rel = relative(parent, candidate)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

// Shortest-first dedupe: a root nested under an earlier one adds no
// coverage, so collapse keeps the watch subscription list small.
function collapseRoots(roots: string[]): string[] {
  const unique = [...new Set(roots.map((root) => resolve(root)))].sort((a, b) => a.length - b.length)
  const collapsed: string[] = []
  for (const root of unique) {
    if (!collapsed.some((kept) => isUnder(kept, root))) collapsed.push(root)
  }
  return collapsed
}

export function deriveWatchRoots(projectRoot: string, include: string[], extraDirs: string[] = []): string[] {
  const root = resolve(projectRoot)
  const prefixes = include.map(staticPrefix)
  const unrooted = prefixes.length === 0 || prefixes.some((prefix) => prefix === undefined)
  const includeRoots = unrooted
    ? [root]
    : prefixes.filter((prefix): prefix is string => prefix !== undefined).map((prefix) => resolve(root, prefix))
  return collapseRoots([...includeRoots, ...extraDirs.map((dir) => resolve(root, dir))])
}

// Root-set diff for the resync rebuild: subscribe only what appeared,
// unsubscribe only what vanished. An unchanged set churns nothing.
function diffWatchRoots(current: string[], next: string[]): { added: string[]; removed: string[] } {
  const before = new Set(current)
  const after = new Set(next)
  return {
    added: next.filter((root) => !before.has(root)),
    removed: current.filter((root) => !after.has(root)),
  }
}

function isIgnorableLine(trimmed: string): boolean {
  return trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')
}

// An anchored pattern resolved below its watch root, or null when it
// escapes the root and can never match a watched event.
function anchoredIgnoreTarget(core: string, watchRoot: string, gitignoreDir: string): string | null {
  const rel = relative(watchRoot, resolve(gitignoreDir, core.startsWith('/') ? core.slice(1) : core))
    .replaceAll('\\', '/')
  return rel === '' || rel.startsWith('..') ? null : rel
}

function basenameIgnoreGlobs(core: string, directoryOnly: boolean): string[] {
  return directoryOnly ? [`**/${core}/**`] : [`**/${core}`, `**/${core}/**`]
}

function anchoredIgnoreGlobs(core: string, watchRoot: string, gitignoreDir: string, directoryOnly: boolean): string[] {
  const target = anchoredIgnoreTarget(core, watchRoot, gitignoreDir)
  if (target === null) return []
  return directoryOnly ? [`${target}/**`] : [target, `${target}/**`]
}

// One .gitignore line to watcher ignore globs: comments, blanks, and
// negations never ignore, bare names match anywhere, anchored paths
// resolve against the gitignore's own directory below the watch root.
function toIgnoreGlobs(pattern: string, watchRoot: string, gitignoreDir: string): string[] {
  const trimmed = pattern.trim()
  if (isIgnorableLine(trimmed)) return []
  const directoryOnly = trimmed.endsWith('/')
  const core = normalizePattern(directoryOnly ? trimmed.slice(0, -1) : trimmed)
  if (core === '') return []
  if (!core.startsWith('/') && !core.includes('/')) return basenameIgnoreGlobs(core, directoryOnly)
  return anchoredIgnoreGlobs(core, watchRoot, gitignoreDir, directoryOnly)
}

// Every ignore glob from one .gitignore file, flattened across lines.
function readIgnoreFile(ignoreFile: string, watchRoot: string, gitignoreDir: string): string[] {
  const globs: string[] = []
  for (const line of readFileSync(ignoreFile, 'utf-8').split(/\r?\n/)) {
    globs.push(...toIgnoreGlobs(line, watchRoot, gitignoreDir))
  }
  return globs
}

// True once the walk reaches the repo root or the filesystem root,
// which ends the ancestor climb for ignore files.
function isWalkEnd(dir: string): boolean {
  return existsSync(join(dir, '.git')) || dirname(dir) === dir
}

// Static ignores plus positive patterns from ancestor .gitignore files
// up to the repo root, so ignored build output never wakes the watcher.
function getIgnoreGlobs(watchRoot: string): string[] {
  const ignores = new Set<string>(STATIC_IGNORE)
  let dir = resolve(watchRoot)
  for (;;) {
    const ignoreFile = join(dir, '.gitignore')
    if (existsSync(ignoreFile)) {
      for (const glob of readIgnoreFile(ignoreFile, watchRoot, dir)) ignores.add(glob)
    }
    if (isWalkEnd(dir)) break
    dir = dirname(dir)
  }
  return [...ignores]
}

interface WatchState {
  projectRoot: string
  isMatch: (path: string) => boolean
  dependencyFiles: Set<string>
  callbacks: WatchCallbacks
}

// A parcel event becomes a watch change only when its relative path falls
// under the include globs or names a config dependency file exactly.
function toWatchChange(event: ParcelEvent, state: WatchState): WatchChange | null {
  const relativePath = relative(state.projectRoot, event.path)
  const eventName: WatchEvent = EVENT_MAP[event.type]
  if (!state.isMatch(relativePath) && !state.dependencyFiles.has(resolve(event.path))) return null
  return { event: eventName, path: event.path, relativePath }
}

function isDroppedEventsError(error: Error): boolean {
  return error.message.includes('Events were dropped')
}

interface ResyncScheduler {
  schedule(): void
  request(): void
  settle(): Promise<void>
}

// Debounce plus serialization behind one resync function: schedule()
// waits for the trailing edge, request() runs now, and a burst behind
// a slow sync costs one extra pass, never a backlog. Settle cancels
// the timer and drains the in-flight pass.
function createResyncScheduler(resync: () => Promise<void>): ResyncScheduler {
  let syncing = false
  let queued = false
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight: Promise<void> | null = null

  async function drain(): Promise<void> {
    syncing = true
    try {
      for (;;) {
        await resync()
        if (!queued || cancelled) break
        queued = false
      }
    } finally {
      syncing = false
    }
  }

  function request(): void {
    if (cancelled) return
    if (syncing) {
      queued = true
      return
    }
    inFlight = drain()
    void inFlight
  }

  function schedule(): void {
    if (cancelled) return
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      request()
    }, RESYNC_SETTLE_MS)
  }

  async function settle(): Promise<void> {
    cancelled = true
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    if (inFlight !== null) await inFlight.catch(() => {})
  }

  return { schedule, request, settle }
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

type ParcelHandler = (error: Error | null, events: ParcelEvent[]) => void

// One parcel callback over every root: matched events report through
// onChange and jointly schedule one debounced resync per burst.
function createParcelHandler(state: WatchState, schedule: () => void, reportError: (error: Error) => void): ParcelHandler {
  return (error: Error | null, events: ParcelEvent[]) => {
    if (error) {
      reportError(toError(error))
      return
    }
    let matched = false
    for (const event of events) {
      const change = toWatchChange(event, state)
      if (!change) continue
      matched = true
      state.callbacks.onChange?.(change)
    }
    if (matched) schedule()
  }
}

// Mutable trigger-scope handle the resync rebuild writes through: the
// captured state the parcel handler closes over, the owning root, the
// current roots, and the live subscriptions keyed by root.
interface TriggerScope {
  state: WatchState
  projectRoot: string
  currentRoots: string[]
  subscriptions: Map<string, AsyncSubscription>
  onParcelEvent: ParcelHandler
}

// The resync-path trigger rebuild: after the compile's fresh load, the
// matcher, dependency files, and parcel subscriptions follow the same
// loaded config the compile used — one load, never two. It writes
// through the captured state the parcel handler already closes over,
// and roots diff so an unchanged set churns no subscription.
async function refreshTriggerScope(scope: TriggerScope): Promise<void> {
  const resyncLoaded = getLastLoadedUserConfig(scope.projectRoot)
  if (resyncLoaded === undefined) return
  scope.state.isMatch = picomatch(resyncLoaded.config.include)
  scope.state.dependencyFiles = new Set(resyncLoaded.dependencyPaths.map((entry) => resolve(entry)))
  const nextRoots = deriveWatchRoots(
    scope.projectRoot,
    resyncLoaded.config.include,
    [...scope.state.dependencyFiles].map((file) => dirname(file))
  )
  const { added, removed } = diffWatchRoots(scope.currentRoots, nextRoots)
  for (const root of removed) {
    const subscription = scope.subscriptions.get(root)
    scope.subscriptions.delete(root)
    if (subscription !== undefined) await subscription.unsubscribe()
  }
  for (const root of added) {
    scope.subscriptions.set(root, await subscribe(root, scope.onParcelEvent, { ignore: getIgnoreGlobs(root) }))
  }
  scope.currentRoots = nextRoots
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
 * Resyncs debounce to a trailing edge and serialize behind the in-flight
 * sync, so a burst of saves costs one rebuild; a failing resync reports
 * through onError and keeps watching. onResync fires only for watch-driven
 * resyncs, never the baseline. A SIGUSR2 poke (a one-shot meeting the
 * session) resyncs now. Resolves with the handle plus the baseline result
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
  // A poke during the baseline queues instead of racing it: the early poke
  // only records, and the live target drains the flag once attached.
  let pokeRequested = false
  let pokeTarget: () => void = () => { pokeRequested = true }
  const onPoke = (): void => { pokeTarget() }
  process.on('SIGUSR2', onPoke)
  try {
    const baseline = await stampedSync(projectRoot, { verbose: options.verbose ?? false, json: options.json ?? false, foldRefDiagnostics: options.foldRefDiagnostics ?? false })

    const state: WatchState = {
      projectRoot,
      isMatch: picomatch(loaded.config.include),
      dependencyFiles: new Set(loaded.dependencyPaths.map((entry) => resolve(entry))),
      callbacks,
    }
    const subscriptions = new Map<string, AsyncSubscription>()
    const initialRoots = deriveWatchRoots(
      projectRoot,
      loaded.config.include,
      [...state.dependencyFiles].map((file) => dirname(file)),
    )

    let stopped = false
    const scheduler = createResyncScheduler(async () => {
      try {
        const result = await stampedSync(projectRoot, { verbose: options.verbose ?? false, json: options.json ?? false, foldRefDiagnostics: options.foldRefDiagnostics ?? false })
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
    const onParcelEvent = createParcelHandler(state, () => scheduler.schedule(), reportError)
    const scope: TriggerScope = { state, projectRoot, currentRoots: initialRoots, subscriptions, onParcelEvent }

    for (const root of scope.currentRoots) {
      subscriptions.set(root, await subscribe(root, onParcelEvent, { ignore: getIgnoreGlobs(root) }))
    }
    if (pokeRequested) scheduler.request()

    async function stop(): Promise<void> {
      stopped = true
      await scheduler.settle()
      await Promise.all([...subscriptions.values()].map(async (subscription) => {
        try {
          await subscription.unsubscribe()
        } catch {
          // Teardown races the backend; a failed unsubscribe is already gone.
        }
      }))
      process.removeListener('SIGUSR2', onPoke)
      session.release()
    }

    return { stop, baseline }
  } catch (error) {
    process.removeListener('SIGUSR2', onPoke)
    session.release()
    throw error
  }
}
