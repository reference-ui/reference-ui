// Reference tasty phase scheduler: it takes the phase payload and emits
// nothing — the cold-start tasty build runs on the next loop iteration while
// sync completes unwatched. Once per process per source dir; ref syncs never
// await it because there is nothing to await. Failures clear the pending mark
// so a later sync retries; the session cache skips builds that already landed.

import { resolve } from 'node:path'
import { onRunBuild, type ReferenceBuildPayload } from './run.ts'
import { getReferenceTastyBuild } from './tasty-build.ts'
import type { ReferenceTastyPayload } from './types.ts'

const pendingTastyBuilds = new Set<string>()

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
  pendingTastyBuilds.add(sourceDir)
  setImmediate(() => {
    onRunBuild(payload, build ?? {}).then(
      () => {
        pendingTastyBuilds.delete(sourceDir)
      },
      () => {
        pendingTastyBuilds.delete(sourceDir)
      }
    )
  })
}
