/** Watch the Reference sync session and invoke a callback on each ready transition. */

import type { SyncSession } from '../session'
import type { ReferenceProjectPaths, ReferenceSyncSessionReader } from './types'

export function watchSyncSessionRefresh(
  getSession: ReferenceSyncSessionReader,
  projectPaths: ReferenceProjectPaths,
  onRefresh: () => void
): { session: SyncSession; stop: () => void } {
  const session = getSession({ cwd: projectPaths.projectRoot, outDir: projectPaths.outDir })
  const stopWatchingRefresh = session.onRefresh(onRefresh)

  return {
    session,
    stop(): void {
      stopWatchingRefresh()
      session.dispose()
    },
  }
}