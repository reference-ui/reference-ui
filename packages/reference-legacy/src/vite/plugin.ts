/** High-level Vite plugin orchestration for Reference UI watch-mode refreshes. */

import type { ViteDevServer } from 'vite'
import { subscribeToManagedOutputWrites } from '../bundlers/output-subscription'
import { log } from '../lib/log'
import { getSyncSession } from '../session'
import { buildHotUpdatePayload } from './hot-updates'
import { shouldDeferHotUpdate } from './hot-update-policy'
import { createManagedWriteBuffer } from './managed-writes'
import { withManagedPackageExcludes } from './optimize'
import { resolveProjectPaths } from './project-paths'
import { watchSyncSessionRefresh } from './sync-session'
import type { ReferenceViteOptions, ReferenceVitePlugin, ReferenceViteUserConfig } from './types'

interface ReferenceViteState {
  projectPaths: ReturnType<typeof resolveProjectPaths>
  server: ViteDevServer | null
  stopWatchingSessionRefresh: (() => void) | null
  stopWatchingManagedOutputs: (() => void) | null
  teardownRegistered: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isViteDevServerLike(value: unknown): value is ViteDevServer {
  if (!isRecord(value)) return false
  if (!isRecord(value.ws) || typeof value.ws.send !== 'function') return false
  if (!isRecord(value.moduleGraph)) return false
  return (
    typeof value.moduleGraph.getModulesByFile === 'function' &&
    typeof value.moduleGraph.invalidateModule === 'function'
  )
}

function warnVite(warned: Set<string>, key: string, message: string, cause?: unknown) {
  if (warned.has(key)) return
  warned.add(key)
  if (cause === undefined) {
    log.warn('[vite]', message)
    return
  }
  log.warn('[vite]', message, cause)
}

export function referenceVite(options: ReferenceViteOptions = {}): ReferenceVitePlugin {
  const managedWrites = createManagedWriteBuffer()
  const getSession = options.internals?.getSyncSession ?? getSyncSession
  const subscribeToWrites = options.internals?.subscribeToManagedOutputWrites ?? subscribeToManagedOutputWrites
  const warned = new Set<string>()
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

    configureServer(devServer: unknown) {
      try {
        if (!isViteDevServerLike(devServer)) {
          warnVite(
            warned,
            'server-shape',
            'referenceVite() did not receive a Vite dev server with moduleGraph and ws.send. Generated-file HMR is disabled. Supported Vite is 5, 6, and 7.',
          )
          return
        }

        state.server = devServer
        attachSessionRefreshListener()
        attachManagedOutputListener()

        if (!state.teardownRegistered) {
          state.teardownRegistered = true
          const httpServer = devServer.httpServer
          if (httpServer && typeof httpServer.once === 'function') {
            httpServer.once('close', disposeWatchers)
          } else {
            warnVite(
              warned,
              'http-close',
              'Vite httpServer.close is unavailable; generated-file watchers may leak until the process exits.',
            )
          }
        }
      } catch (error) {
        warnVite(
          warned,
          'configure-server',
          'configureServer failed; generated-file HMR is disabled so the Vite dev server can stay up.',
          error,
        )
      }
    },

    closeBundle() {
      disposeWatchers()
    },

    handleHotUpdate(ctx: { file: string; modules?: { length: number } }) {
      try {
        if (typeof ctx?.file !== 'string') {
          warnVite(
            warned,
            'hot-ctx',
            'handleHotUpdate received a context without a file path; leaving this update to Vite.',
          )
          return
        }
        if (!shouldDeferHotUpdate(ctx, state.projectPaths)) return
        managedWrites.remember(ctx.file)
        return []
      } catch (error) {
        warnVite(
          warned,
          'hot-update',
          'handleHotUpdate failed; leaving this update to Vite so the dev server stays up.',
          error,
        )
      }
    },
  }

  function attachSessionRefreshListener(): void {
    try {
      state.stopWatchingSessionRefresh?.()
      state.stopWatchingSessionRefresh = watchSyncSessionRefresh(
        getSession,
        state.projectPaths,
        flushBufferedWrites,
      ).stop
    } catch (error) {
      warnVite(
        warned,
        'session-watch',
        'Could not watch the Reference sync session; generated HMR may miss updates until restart.',
        error,
      )
    }
  }

  function attachManagedOutputListener(): void {
    void subscribeToWrites(state.projectPaths, (file) => {
      managedWrites.remember(file)
    })
      .then((subscription) => {
        state.stopWatchingManagedOutputs?.()
        state.stopWatchingManagedOutputs = () => {
          const unsubscribeResult = subscription.unsubscribe()
          if (unsubscribeResult instanceof Promise) {
            unsubscribeResult.catch((error) => {
              warnVite(warned, 'unsubscribe', 'Failed to unsubscribe generated-file watchers.', error)
            })
          }
        }
      })
      .catch((error) => {
        warnVite(
          warned,
          'output-watch',
          'Could not subscribe to generated-file writes; generated HMR may miss updates until restart.',
          error,
        )
      })
  }

  function disposeWatchers(): void {
    try {
      state.teardownRegistered = false
      state.stopWatchingSessionRefresh?.()
      state.stopWatchingSessionRefresh = null
      const stopManagedOutputs = state.stopWatchingManagedOutputs
      state.stopWatchingManagedOutputs = null
      stopManagedOutputs?.()
      state.server = null
      managedWrites.clear()
    } catch (error) {
      warnVite(warned, 'dispose', 'Failed to dispose generated-file watchers.', error)
    }
  }

  function flushBufferedWrites(): void {
    const currentServer = state.server
    if (!currentServer) return

    try {
      managedWrites.flush((pendingFiles) => {
        const payload = buildHotUpdatePayload(currentServer, pendingFiles)
        if (!payload) return
        currentServer.ws.send(payload)
      })
    } catch (error) {
      warnVite(
        warned,
        'flush',
        'Failed to flush generated HMR; leaving the current Vite update cycle alone.',
        error,
      )
    }
  }
}
