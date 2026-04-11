/** High-level Vite plugin orchestration for Reference UI watch-mode refreshes. */

import { getSyncSession } from '../session'
import { buildHotUpdatePayload } from './hot-updates'
import { createManagedWriteBuffer } from './managed-writes'
import { withManagedPackageExcludes } from './optimize'
import { isManagedOutputFile } from './outputs'
import { resolveProjectPaths } from './project-paths'
import { watchSyncSessionRefresh } from './sync-session'
import type {
  ReferenceViteDevServer,
  ReferenceViteHotUpdateContext,
  ReferenceViteOptions,
  ReferenceVitePlugin,
  ReferenceViteUserConfig,
} from './types'

export function referenceVite(options: ReferenceViteOptions = {}): ReferenceVitePlugin {
  let currentProjectPaths = resolveProjectPaths(process.cwd())
  const managedWrites = createManagedWriteBuffer()
  const getSession = options.internals?.getSyncSession ?? getSyncSession
  let server: ReferenceViteDevServer | null = null
  let stopWatchingSessionRefresh: (() => void) | null = null

  return {
    name: 'reference-ui:vite',

    config(userConfig: ReferenceViteUserConfig): { optimizeDeps: { exclude: string[] } } {
      return withManagedPackageExcludes(userConfig)
    },

    configResolved(config: { root: string }) {
      currentProjectPaths = resolveProjectPaths(config.root)
    },

    configureServer(devServer: ReferenceViteDevServer) {
      server = devServer
      startWatchingSyncSessionRefresh()
      return stopWatchingViteSession
    },

    handleHotUpdate(ctx: ReferenceViteHotUpdateContext) {
      if (!isManagedOutputFile(ctx.file, currentProjectPaths.managedOutputRoots)) return
      managedWrites.remember(ctx.file)
      return []
    },
  }

  function startWatchingSyncSessionRefresh(): void {
    stopWatchingSessionRefresh?.()

    stopWatchingSessionRefresh = watchSyncSessionRefresh(
      getSession,
      currentProjectPaths,
      flushManagedWrites,
    ).stop
  }

  function stopWatchingViteSession(): void {
    stopWatchingSessionRefresh?.()
    stopWatchingSessionRefresh = null
    server = null
    managedWrites.clear()
  }

  function flushManagedWrites(): void {
    const currentServer = server
    if (!currentServer) return
    managedWrites.flush((pendingFiles) => {
      const payload = buildHotUpdatePayload(currentServer, pendingFiles)
      if (!payload) return
      currentServer.ws.send(payload)
    })
  }
}