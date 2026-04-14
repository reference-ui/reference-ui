/** Focused tests for the Reference UI Vite integration's package and HMR behavior. */

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_OUT_DIR } from '../constants'
import type { RefreshEvent, SyncSession } from '../session'
import { referenceVite } from './plugin'
import type { ReferenceViteUserConfig } from './types'

/**
 * Vite’s `Plugin` types hooks as `ObjectHook` (function or `{ handler }`). Our
 * plugin only implements plain functions; cast for direct calls in tests.
 */
type TestableReferenceVitePlugin = {
  name: string
  config?: (userConfig: ReferenceViteUserConfig) => { optimizeDeps: { exclude: string[] } }
  configResolved?: (config: { root: string }) => void
  configureServer?: (devServer: unknown) => (() => void) | void
  handleHotUpdate?: (ctx: { file: string }) => unknown
}

function testableReferenceVite(
  ...args: Parameters<typeof referenceVite>
): TestableReferenceVitePlugin {
  return referenceVite(...args) as TestableReferenceVitePlugin
}

describe('referenceUiVitePlugin', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('merges managed packages into optimizeDeps.exclude', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))
    const plugin = testableReferenceVite()
    plugin.configResolved?.({ root: cwd })

    expect(plugin.config?.({ optimizeDeps: { exclude: ['react'] } })).toEqual({
      optimizeDeps: {
        exclude: [
          'react',
          '@reference-ui/react',
          '@reference-ui/system',
          '@reference-ui/styled',
          '@reference-ui/types',
        ],
      },
    })
  })

  it('treats generated non-package outputs like virtual as managed HMR roots', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))
    const plugin = testableReferenceVite()
    plugin.configResolved?.({ root: cwd })

    const result = await plugin.handleHotUpdate?.({
      file: `${cwd}/${DEFAULT_OUT_DIR}/virtual/src/example.tsx`,
    })

    expect(result).toEqual([])
  })

  it('coalesces rapid managed-output writes into one hot update after sync ready', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))
    mkdirSync(join(cwd, DEFAULT_OUT_DIR, 'react'), { recursive: true })
    writeFileSync(join(cwd, DEFAULT_OUT_DIR, 'react', 'react.mjs'), 'export {}\n')

    const sends: UpdateEvent[] = []
    const { dispose, emitRefresh, session } = createTestSession()

    const module = {
      url: '/@fs/react.mjs',
      type: 'js' as const,
    }

    const invalidateModule = vi.fn()
    const { plugin, teardown } = setupManagedVitePlugin({
      cwd,
      invalidateModule,
      module,
      sends,
      session,
    })

    const [firstUpdate, secondUpdate, thirdUpdate] = await triggerManagedOutputUpdates(plugin, cwd)

    expect(firstUpdate).toEqual([])
    expect(secondUpdate).toEqual([])
    expect(thirdUpdate).toEqual([])
    expect(sends).toEqual([])

    emitRefresh()

    expect(sends).toEqual([
      {
        type: 'update',
        updates: [
          {
            type: 'js-update',
            path: '/@fs/react.mjs',
            acceptedPath: '/@fs/react.mjs',
            timestamp: expect.any(Number),
          },
        ],
      },
    ])
    expect(invalidateModule).toHaveBeenCalledTimes(1)

    emitRefresh()

    expect(sends).toHaveLength(1)

    teardown?.()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})

interface UpdateEvent {
  type: 'update'
  updates: Array<{
    type: 'js-update' | 'css-update'
    path: string
    acceptedPath: string
    timestamp: number
  }>
}

async function triggerManagedOutputUpdates(plugin: TestableReferenceVitePlugin, cwd: string) {
  return Promise.all([
    plugin.handleHotUpdate?.({
      file: `${cwd}/${DEFAULT_OUT_DIR}/react/react.mjs`,
    } as never),
    plugin.handleHotUpdate?.({
      file: `${cwd}/${DEFAULT_OUT_DIR}/styled/styles.css`,
    } as never),
    plugin.handleHotUpdate?.({
      file: `${cwd}/${DEFAULT_OUT_DIR}/types/types.mjs`,
    } as never),
  ])
}

function setupManagedVitePlugin(options: {
  cwd: string
  invalidateModule: ReturnType<typeof vi.fn>
  module: { url: string; type: 'js' }
  sends: UpdateEvent[]
  session: SyncSession
}): { plugin: TestableReferenceVitePlugin; teardown: (() => void) | void } {
  const plugin = testableReferenceVite({
    internals: {
      getSyncSession: () => options.session,
    },
  })
  plugin.configResolved?.({ root: options.cwd })

  return {
    plugin,
    teardown: plugin.configureServer?.({
      ws: {
        send(payload: UpdateEvent) {
          options.sends.push(payload)
        },
      },
      moduleGraph: {
        getModulesByFile(file: string) {
          if (file === `${options.cwd}/${DEFAULT_OUT_DIR}/react/react.mjs`) {
            return new Set([options.module])
          }
          return undefined
        },
        invalidateModule: options.invalidateModule,
      },
    }),
  }
}

function createTestSession(): {
  dispose: ReturnType<typeof vi.fn>
  emitRefresh(): void
  session: SyncSession
} {
  const dispose = vi.fn()
  let refreshHandler: ((event: RefreshEvent) => void) | undefined

  return {
    dispose,
    emitRefresh(): void {
      refreshHandler?.({ changedOutputs: [] })
    },
    session: {
      onRefresh(handler) {
        refreshHandler = handler
        return () => {
          if (refreshHandler === handler) {
            refreshHandler = undefined
          }
        }
      },
      dispose,
    },
  }
}