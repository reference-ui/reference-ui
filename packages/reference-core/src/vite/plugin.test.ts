/** Focused tests for the Reference UI Vite integration's package and HMR behavior. */

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RefreshEvent, SyncSession } from '../session'
import { referenceVite } from './plugin'
import type { ReferenceVitePlugin } from './types'

describe('referenceUiVitePlugin', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('merges managed packages into optimizeDeps.exclude', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))
    const plugin = referenceVite()
    plugin.configResolved?.({ root: cwd } as never)

    expect(plugin.config?.({ optimizeDeps: { exclude: ['react'] } } as never)).toEqual({
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
    const plugin = referenceVite()
    plugin.configResolved?.({ root: cwd } as never)

    const result = await plugin.handleHotUpdate?.({
      file: `${cwd}/.reference-ui/virtual/src/example.tsx`,
    } as never)

    expect(result).toEqual([])
  })

  it('coalesces rapid managed-output writes into one hot update after sync ready', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))
    mkdirSync(join(cwd, '.reference-ui', 'react'), { recursive: true })
    writeFileSync(join(cwd, '.reference-ui', 'react', 'react.mjs'), 'export {}\n')

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

async function triggerManagedOutputUpdates(plugin: ReferenceVitePlugin, cwd: string) {
  return Promise.all([
    plugin.handleHotUpdate?.({
      file: `${cwd}/.reference-ui/react/react.mjs`,
    } as never),
    plugin.handleHotUpdate?.({
      file: `${cwd}/.reference-ui/styled/styles.css`,
    } as never),
    plugin.handleHotUpdate?.({
      file: `${cwd}/.reference-ui/types/types.mjs`,
    } as never),
  ])
}

function setupManagedVitePlugin(options: {
  cwd: string
  invalidateModule: ReturnType<typeof vi.fn>
  module: { url: string; type: 'js' }
  sends: UpdateEvent[]
  session: SyncSession
}): { plugin: ReferenceVitePlugin; teardown: (() => void) | void } {
  const plugin = referenceVite({
    internals: {
      getSyncSession: () => options.session,
    },
  })
  plugin.configResolved?.({ root: options.cwd } as never)

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
          if (file === `${options.cwd}/.reference-ui/react/react.mjs`) {
            return new Set([options.module])
          }
          return undefined
        },
        invalidateModule: options.invalidateModule,
      },
    } as never),
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