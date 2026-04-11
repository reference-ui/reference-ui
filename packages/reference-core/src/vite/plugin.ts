/** High-level Vite plugin orchestration for Reference UI watch-mode refreshes. */

import { getSyncSession, type SyncSession } from '../session'
import { createManagedWriteBuffer } from './managed-writes'
import { withManagedPackageExcludes } from './optimize'
import { isManagedOutputFile } from './outputs'
import { resolveProjectPaths } from './project-paths'
import { watchSyncSessionRefresh } from './sync-session'
import type {
  ReferenceViteDevServer,
  ReferenceViteOptions,
  ReferenceVitePlugin,
  ReferenceViteProjectPaths,
} from './types'

export function referenceVite(options: ReferenceViteOptions = {}): ReferenceVitePlugin {
  let currentProjectPaths = resolveProjectPaths(process.cwd())
  const managedWrites = createManagedWriteBuffer()
  const getSession = options.internals?.getSyncSession ?? getSyncSession
  let server: ReferenceViteDevServer | null = null
  let session: SyncSession | null = null
  let stopWatchingSessionRefresh: (() => void) | null = null

  return {
    name: 'reference-ui:vite',

    config(userConfig: { optimizeDeps?: { exclude?: string[] } }): { optimizeDeps: { exclude: string[] } } {
      return withManagedPackageExcludes(userConfig)
    },

    configResolved(config: { root: string }) {
      currentProjectPaths = resolveProjectPaths(config.root)
    },

    configureServer(devServer: any) {
      server = devServer as ReferenceViteDevServer
      startWatchingSyncSessionRefresh()
      return stopWatchingViteSession
    },

    handleHotUpdate(ctx: { file: string }) {
      if (!isManagedOutputFile(ctx.file, currentProjectPaths.managedOutputRoots)) return
      managedWrites.remember(ctx.file)
      return []
    },
  }

  function startWatchingSyncSessionRefresh(): void {
    stopWatchingSessionRefresh?.()

    const watcher = watchSyncSessionRefresh(getSession, currentProjectPaths, flushManagedWrites)
    session = watcher.session
    stopWatchingSessionRefresh = watcher.stop
  }

  function stopWatchingViteSession(): void {
    stopWatchingSessionRefresh?.()
    stopWatchingSessionRefresh = null
    session = null
    server = null
    managedWrites.clear()
  }

  function flushManagedWrites(): void {
    if (!server) return
    managedWrites.flush(server)
  }
}