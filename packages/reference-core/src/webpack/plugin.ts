/** High-level Webpack plugin orchestration for Reference UI watch-mode refreshes. */

import { resolve } from 'node:path'
import { getSyncSession } from '../session'
import { createManagedWriteBuffer } from '../bundlers/managed-writes'
import { subscribeToManagedOutputWrites } from '../bundlers/output-subscription'
import { resolveProjectPaths } from '../bundlers/project-paths'
import { watchSyncSessionRefresh } from '../bundlers/sync-session'
import { withManagedOutputIgnores } from './watch-options'
import type {
  ReferenceWebpackCompiler,
  ReferenceWebpackOptions,
  ReferenceWebpackPlugin,
} from './types'

export function referenceWebpack(
  options: ReferenceWebpackOptions = {}
): ReferenceWebpackPlugin {
  let currentProjectPaths = resolveProjectPaths(process.cwd())
  const managedWrites = createManagedWriteBuffer()
  const getSession = options.internals?.getSyncSession ?? getSyncSession
  const subscribeToWrites =
    options.internals?.subscribeToManagedOutputWrites ?? subscribeToManagedOutputWrites
  let compiler: ReferenceWebpackCompiler | null = null
  let stopWatchingSessionRefresh: (() => void) | null = null
  let stopWatchingManagedOutputs: (() => void) | null = null

  return {
    apply(webpackCompiler) {
      compiler = webpackCompiler
      currentProjectPaths = resolveProjectPaths(webpackCompiler.context ?? process.cwd())
      webpackCompiler.options.cache = false
      webpackCompiler.options.resolve = {
        ...webpackCompiler.options.resolve,
        alias: {
          ...webpackCompiler.options.resolve?.alias,
          react: resolve(currentProjectPaths.projectRoot, 'node_modules/react'),
          'react-dom': resolve(currentProjectPaths.projectRoot, 'node_modules/react-dom'),
          scheduler: resolve(currentProjectPaths.projectRoot, 'node_modules/scheduler'),
          '@reference-ui/react': resolve(
            currentProjectPaths.projectRoot,
            'node_modules/@reference-ui/react',
          ),
          '@reference-ui/styled': resolve(
            currentProjectPaths.projectRoot,
            'node_modules/@reference-ui/styled',
          ),
          '@reference-ui/system': resolve(
            currentProjectPaths.projectRoot,
            'node_modules/@reference-ui/system',
          ),
          '@reference-ui/system/baseSystem': resolve(
            currentProjectPaths.projectRoot,
            'node_modules/@reference-ui/system/baseSystem.mjs',
          ),
          '@reference-ui/types': resolve(
            currentProjectPaths.projectRoot,
            'node_modules/@reference-ui/types',
          ),
        },
      }
      webpackCompiler.options.module = {
        ...webpackCompiler.options.module,
        unsafeCache: false,
      }
      webpackCompiler.options.snapshot = {
        ...webpackCompiler.options.snapshot,
        managedPaths: [],
      }
      webpackCompiler.options.watchOptions = {
        ...webpackCompiler.options.watchOptions,
        ignored: withManagedOutputIgnores(
          webpackCompiler.options.watchOptions?.ignored,
          currentProjectPaths,
        ),
      }

      startWatchingSyncSessionRefresh()
      void startWatchingManagedOutputs()

      webpackCompiler.hooks.watchClose.tap('reference-ui:webpack', () => {
        stopWatchingWebpackSession()
      })
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

  async function startWatchingManagedOutputs(): Promise<void> {
    stopWatchingManagedOutputs?.()

    const subscription = await subscribeToWrites(currentProjectPaths, (file) => {
      managedWrites.remember(file)
    })
    stopWatchingManagedOutputs = () => {
      const unsubscribeResult = subscription.unsubscribe()
      if (unsubscribeResult instanceof Promise) {
        unsubscribeResult.catch(() => {})
      }
    }
  }

  function stopWatchingWebpackSession(): void {
    stopWatchingSessionRefresh?.()
    stopWatchingSessionRefresh = null
    const stopManagedOutputs = stopWatchingManagedOutputs
    stopWatchingManagedOutputs = null
    stopManagedOutputs?.()
    compiler = null
    managedWrites.clear()
  }

  function flushManagedWrites(): void {
    if (!compiler?.watching) return

    managedWrites.flush(() => {
      compiler?.watching?.invalidate()
    })
  }
}