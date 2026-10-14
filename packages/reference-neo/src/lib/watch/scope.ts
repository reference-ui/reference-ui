// Watch trigger scope: what one loaded config makes the watcher see, and how the
// live scope follows each sync. It takes the loaded config and the watch root,
// and holds the classify state plus the live parcel subscriptions. It emits the
// derived scope (matcher, dependency files, match snapshot, watch roots), the
// widest merge of two scopes, and the root diff a resync applies. A failed sync
// widens the live scope instead of narrowing it, so the save that fixes the
// failure is still seen, and it also watches the files the failed load named.

import { existsSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { subscribe, type AsyncSubscription } from '@parcel/watcher'
import {
  getAttemptedUserConfigDependencies,
  getLastLoadedUserConfig,
  type LoadedUserConfig,
} from '../../config/load.ts'
import type { ClassifyState } from './classify.ts'
import { toError, type ParcelHandler } from './handler.ts'
import {
  createIncludeMatcher,
  deriveWatchRoots,
  diffWatchRoots,
  ENGINE_IGNORE_GLOBS,
  isEngineIgnoredDir,
  mergeSnapshots,
  scanMatches,
  type IncludeMatcher,
  type MatchSnapshot,
} from './match.ts'

/** The scope one config implies: the matcher, dependency files, match snapshot, and watch roots. */
export interface WatchScope {
  isMatch: IncludeMatcher
  dependencyFiles: Set<string>
  snapshot: MatchSnapshot
  roots: string[]
}

/** The live trigger scope: the state the parcel handler reads, the subscribed roots, and their subscriptions. */
export interface TriggerScope {
  readonly projectRoot: string
  readonly watchRoot: string
  readonly state: ClassifyState
  readonly subscriptions: Map<string, AsyncSubscription>
  readonly onEvent: ParcelHandler
  readonly report: (error: Error) => void
  currentRoots: string[]
}

// A dependency file may not exist yet. Its real path is then the real path of its
// nearest existing ancestor with the missing tail appended, so a file created later
// compares equal to the path parcel reports for it.
function dependencyPathOf(entry: string): string {
  const absolute = resolve(entry)
  if (existsSync(absolute)) return realpathSync(absolute)
  const parent = dirname(absolute)
  return parent === absolute ? absolute : join(dependencyPathOf(parent), basename(absolute))
}

// The nearest directory that exists for a dependency file: a subscription needs a real directory.
function existingDirOf(file: string): string {
  let dir = dirname(file)
  while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir)
  return dir
}

// A root covers a candidate unless the candidate sits under an engine-ignored directory
// of that root: the root's subscription drops every event there, so it needs its own.
function coversRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate)
  const inside = rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
  return inside && !isEngineIgnoredDir(rel)
}

// Shortest-first dedupe over coverage: a root another kept root covers adds nothing.
function unionRoots(roots: string[]): string[] {
  const unique = [...new Set(roots.map((root) => resolve(root)))].sort((a, b) => a.length - b.length)
  const kept: string[] = []
  for (const root of unique) {
    if (!kept.some((keeper) => coversRoot(keeper, root))) kept.push(root)
  }
  return kept
}

export function deriveScope(watchRoot: string, loaded: LoadedUserConfig): WatchScope {
  const include = loaded.config.include
  const dependencyFiles = new Set(loaded.dependencyPaths.map(dependencyPathOf))
  const snapshot = scanMatches(watchRoot, include)
  const extraDirs = [...[...dependencyFiles].map(existingDirOf), ...snapshot.linkDirs]
  const isCovered = (dir: string): boolean => !isEngineIgnoredDir(relative(watchRoot, dir))
  return {
    isMatch: createIncludeMatcher(include),
    dependencyFiles,
    snapshot,
    roots: unionRoots([
      ...deriveWatchRoots(watchRoot, include, extraDirs.filter(isCovered)),
      ...extraDirs.filter((dir) => !isCovered(dir)),
    ]),
  }
}

// Widest of two scopes: a path either one matches stays in scope, every
// dependency file and every match either one knew stays known, and the roots
// cover both sets. Used after a failed sync, which must not narrow the watch.
export function mergeScope(a: WatchScope, b: WatchScope): WatchScope {
  return {
    isMatch: (relativePath) => a.isMatch(relativePath) || b.isMatch(relativePath),
    dependencyFiles: new Set([...a.dependencyFiles, ...b.dependencyFiles]),
    snapshot: mergeSnapshots(a.snapshot, b.snapshot),
    roots: unionRoots([...a.roots, ...b.roots]),
  }
}

function liveScope(scope: TriggerScope): WatchScope {
  return {
    isMatch: scope.state.isMatch,
    dependencyFiles: scope.state.dependencyFiles,
    snapshot: scope.state.snapshot,
    roots: scope.currentRoots,
  }
}

async function unsubscribeRoot(scope: TriggerScope, root: string): Promise<void> {
  const subscription = scope.subscriptions.get(root)
  scope.subscriptions.delete(root)
  if (subscription === undefined) return
  try {
    await subscription.unsubscribe()
  } catch {
    // Teardown races the backend; a failed unsubscribe means the root is already gone.
  }
}

// A root that cannot be subscribed reports and stays out of currentRoots, so
// the next sync retries it. Returns whether the subscription landed.
async function subscribeRoot(scope: TriggerScope, root: string): Promise<boolean> {
  try {
    scope.subscriptions.set(root, await subscribe(root, scope.onEvent, { ignore: ENGINE_IGNORE_GLOBS }))
    return true
  } catch (error) {
    scope.report(toError(error))
    return false
  }
}

/**
 * Rebuild the live scope from the config the latest sync loaded. A widened
 * rebuild (after a failed sync) keeps everything the live scope already
 * covers, and also watches the files the failed load imported or tried to
 * import. Roots diff, so an unchanged set churns no subscription. Resolves true
 * when a new root subscribed: edits under it between the sync's reads and that
 * subscription were never delivered, so the caller runs one catch-up sync.
 */
export async function refreshTriggerScope(scope: TriggerScope, widen: boolean): Promise<boolean> {
  const latest = getLastLoadedUserConfig(scope.projectRoot)
  if (latest === undefined) return false
  const attempted = widen ? getAttemptedUserConfigDependencies(scope.projectRoot) : []
  const fresh = deriveScope(scope.watchRoot, {
    config: latest.config,
    dependencyPaths: [...latest.dependencyPaths, ...attempted],
  })
  const next = widen ? mergeScope(liveScope(scope), fresh) : fresh
  scope.state.isMatch = next.isMatch
  scope.state.dependencyFiles = next.dependencyFiles
  scope.state.snapshot = next.snapshot
  const { added, removed } = diffWatchRoots(scope.currentRoots, next.roots)
  for (const root of removed) await unsubscribeRoot(scope, root)
  let subscribed = 0
  for (const root of added) {
    if (await subscribeRoot(scope, root)) subscribed += 1
  }
  scope.currentRoots = next.roots.filter((root) => scope.subscriptions.has(root))
  return subscribed > 0
}

export async function unsubscribeAll(subscriptions: Map<string, AsyncSubscription>): Promise<void> {
  await Promise.all([...subscriptions.values()].map(async (subscription) => {
    try {
      await subscription.unsubscribe()
    } catch {
      // Teardown races the backend; a failed unsubscribe is already gone.
    }
  }))
}
