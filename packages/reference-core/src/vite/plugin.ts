/** High-level Vite plugin orchestration for Reference UI watch-mode refreshes. */

import type { HmrContext, Plugin, ViteDevServer } from 'vite'
import { subscribeToManagedOutputWrites } from '../bundlers/output-subscription'
import { getSyncSession } from '../session'
import { buildHotUpdatePayload } from './hot-updates'
import { shouldDeferHotUpdate } from './hot-update-policy'
import { createManagedWriteBuffer } from './managed-writes'
import { withManagedPackageExcludes } from './optimize'
import { resolveProjectPaths } from './project-paths'
import { watchSyncSessionRefresh } from './sync-session'
import type { ReferenceViteOptions, ReferenceViteUserConfig } from './types'

interface ReferenceViteState {
  projectPaths: ReturnType<typeof resolveProjectPaths>
  server: ViteDevServer | null
  stopWatchingSessionRefresh: (() => void) | null
  stopWatchingManagedOutputs: (() => void) | null
  teardownRegistered: boolean
}

export function referenceVite(options: ReferenceViteOptions = {}): Plugin {
  const managedWrites = createManagedWriteBuffer()
  const getSession = options.internals?.getSyncSession ?? getSyncSession
  const subscribeToWrites = options.internals?.subscribeToManagedOutputWrites ?? subscribeToManagedOutputWrites
  const state: ReferenceViteState = {
    projectPaths: resolveProjectPaths(process.cwd()),
    server: null,
    stopWatchingSessionRefresh: null,
    stopWatchingManagedOutputs: null,
    teardownRegistered: false,
  }

  return {
    name: 'reference-ui:vite',

    config(userConfig: ReferenceViteUserConfig): { optimizeDeps: { exclude: string[] } } {
      return withManagedPackageExcludes(userConfig)
    },

    configResolved(config: { root: string }) {
      state.projectPaths = resolveProjectPaths(config.root)
    },

    configureServer(devServer: ViteDevServer) {
      state.server = devServer
      attachSessionRefreshListener()
      attachManagedOutputListener().catch(() => {})

      if (!state.teardownRegistered) {
        state.teardownRegistered = true
        devServer.httpServer?.once('close', disposeWatchers)
      }
    },

    closeBundle() {
      disposeWatchers()
    },

    handleHotUpdate(ctx: HmrContext) {
      if (!shouldDeferHotUpdate(ctx, state.projectPaths)) return
      managedWrites.remember(ctx.file)
      return []
    },
  }

  function attachSessionRefreshListener(): void {
    state.stopWatchingSessionRefresh?.()

    state.stopWatchingSessionRefresh = watchSyncSessionRefresh(
      getSession,
      state.projectPaths,
      flushBufferedWrites,
    ).stop
  }

  async function attachManagedOutputListener(): Promise<void> {
    state.stopWatchingManagedOutputs?.()

    const subscription = await subscribeToWrites(state.projectPaths, (file) => {
      managedWrites.remember(file)
    })

    state.stopWatchingManagedOutputs = () => {
      const unsubscribeResult = subscription.unsubscribe()
      if (unsubscribeResult instanceof Promise) {
        unsubscribeResult.catch(() => {})
      }
    }
  }

  function disposeWatchers(): void {
    state.teardownRegistered = false
    state.stopWatchingSessionRefresh?.()
    state.stopWatchingSessionRefresh = null
    const stopManagedOutputs = state.stopWatchingManagedOutputs
    state.stopWatchingManagedOutputs = null
    stopManagedOutputs?.()
    state.server = null
    managedWrites.clear()
  }

  function flushBufferedWrites(): void {
    const currentServer = state.server
    if (!currentServer) return

    managedWrites.flush((pendingFiles) => {
      const payload = buildHotUpdatePayload(currentServer, pendingFiles)
      if (!payload) return
      currentServer.ws.send(payload)
    })
  }
}