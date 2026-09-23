// Reference tasty phase scheduler: it takes the phase payload and emits
// nothing — the cold-start tasty build runs on the next loop iteration while
// sync completes unwatched. Once per process per source dir; ref syncs never
// await it because there is nothing to await. Failures clear the pending mark
// so a later sync retries; the session cache skips builds that already landed.
// One-shot CLIs drain the pending build via flushReferenceBuild below, since a
// process that exits never runs the background loop the scheduler assumes.

import { resolve } from 'node:path'
import type { ReferenceBuildResult } from './events.ts'
import { onRunBuild, type ReferenceBuildPayload } from './run.ts'
import { getReferenceTastyBuild } from './tasty-build.ts'
import type { ReferenceTastyPayload } from './types.ts'

const pendingTastyBuilds = new Map<string, Promise<ReferenceBuildResult>>()

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
  const pending = new Promise<ReferenceBuildResult>((resolvePending) => {
    setImmediate(() => {
      onRunBuild(payload, build ?? {}).then(
        (result) => {
          pendingTastyBuilds.delete(sourceDir)
          resolvePending(result)
        },
        (reason: unknown) => {
          pendingTastyBuilds.delete(sourceDir)
          const message = reason instanceof Error ? reason.message : String(reason)
          resolvePending({ status: 'failed', message })
        }
      )
    })
  })
  pendingTastyBuilds.set(sourceDir, pending)
}

/**
 * Drain the scheduled tasty build for a source dir, if one is pending. The
 * in-process sync path never calls this (background loop only, S5); the
 * one-shot CLI must (its process exits before the loop runs). Resolves
 * undefined when nothing is pending — either the build already landed in the
 * session cache or none was ever scheduled.
 */
export function flushReferenceBuild(
  sourceDir: string
): Promise<ReferenceBuildResult | undefined> {
  return pendingTastyBuilds.get(resolve(sourceDir)) ?? Promise.resolve(undefined)
}
