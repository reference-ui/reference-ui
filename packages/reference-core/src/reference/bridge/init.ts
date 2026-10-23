// Reference tasty phase scheduler: it takes the phase payload and emits
// nothing — the cold-start tasty build runs on the next loop iteration while
// sync completes unwatched. Once per process per source dir; ref syncs never
// await it because there is nothing to await. Failures clear the pending mark
// so a later sync retries; the session cache skips builds that already landed.
// One-shot CLIs drain the build via flushReferenceBuild below, since a process
// that exits never runs the background loop the scheduler assumes. A build that
// settles before the drain parks its result until drained; this is not caching,
// as the drain deletes it and the next scheduled build clears a stale one.

import { resolve } from 'node:path'
import type { ReferenceBuildResult } from './events.ts'
import { onRunBuild, type ReferenceBuildPayload } from './run.ts'
import { getReferenceTastyBuild } from './tasty-build.ts'
import type { ReferenceTastyPayload } from './types.ts'

const pendingTastyBuilds = new Map<string, Promise<ReferenceBuildResult>>()
// Results that settled before anyone drained them, held only until the first drain.
const settledTastyBuilds = new Map<string, ReferenceBuildResult>()

function settle(sourceDir: string, result: ReferenceBuildResult): ReferenceBuildResult {
  pendingTastyBuilds.delete(sourceDir)
  settledTastyBuilds.set(sourceDir, result)
  return result
}

/**
 * Schedule the cold-start reference tasty build on the deprioritized
 * background loop. Returns before the build starts; sync completes while the
 * manifest lands after. Safe to call per sync — later calls no-op once a
 * build is pending or cached.
 */
export function initReference(
  payload: ReferenceTastyPayload,
  build?: ReferenceBuildPayload
): void {
  const sourceDir = resolve(payload.sourceDir)
  if (pendingTastyBuilds.has(sourceDir)) return
  if (getReferenceTastyBuild(sourceDir) !== undefined) return
  settledTastyBuilds.delete(sourceDir)
  const pending = new Promise<ReferenceBuildResult>((resolvePending) => {
    setImmediate(() => {
      onRunBuild(payload, build ?? {}).then(
        (result) => resolvePending(settle(sourceDir, result)),
        (reason: unknown) => {
          const message = reason instanceof Error ? reason.message : String(reason)
          resolvePending(settle(sourceDir, { status: 'failed', message }))
        }
      )
    })
  })
  pendingTastyBuilds.set(sourceDir, pending)
}

/**
 * Drain the scheduled tasty build for a source dir. A pending build drains as
 * its promise; a build that already settled drains as its parked result, which
 * the drain removes, so each result comes back exactly once. The in-process
 * sync path never calls this (background loop only); the one-shot CLI must (its
 * process exits before the loop runs). Resolves undefined when nothing is
 * pending or parked: the result was already drained, or none was scheduled.
 * Without the drain, types.mjs keeps its ./tasty/runtime.js edge while
 * types/tasty/ never lands, and any bundler resolving @reference-ui/types
 * fails (REF-10).
 */
export function flushReferenceBuild(
  sourceDir: string
): Promise<ReferenceBuildResult | undefined> {
  const key = resolve(sourceDir)
  const pending = pendingTastyBuilds.get(key)
  if (pending) return pending.then((result) => drainSettled(key, result))
  const settled = settledTastyBuilds.get(key)
  settledTastyBuilds.delete(key)
  return Promise.resolve(settled)
}

// A drained pending build must not be drained again from the settled map.
function drainSettled(key: string, result: ReferenceBuildResult): ReferenceBuildResult {
  if (settledTastyBuilds.get(key) === result) settledTastyBuilds.delete(key)
  return result
}

/** True while the cold build for sourceDir is in flight: a sync that lands now may miss its scan. */
export function isReferenceBuildPending(sourceDir: string): boolean {
  return pendingTastyBuilds.has(resolve(sourceDir))
}
