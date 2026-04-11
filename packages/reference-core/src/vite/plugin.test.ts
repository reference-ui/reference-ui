/** Focused tests for the Reference UI Vite integration's package and HMR behavior. */

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GetSyncSessionOptions, RefreshEvent, SyncSession } from '../session'
import { referenceVite } from './plugin'

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
    const dispose = vi.fn()
    let refreshHandler: ((event: RefreshEvent) => void) | undefined

    const session: SyncSession = {
      onRefresh(handler) {
        refreshHandler = handler
        return () => {
          if (refreshHandler === handler) {
            refreshHandler = undefined
          }
        }
      },
      dispose,
    }

    const module = {
      url: '/@fs/react.mjs',
      type: 'js',
    }

    const invalidateModule = vi.fn()

    const plugin = referenceVite({
      internals: {
        getSyncSession: (_options: GetSyncSessionOptions) => session,
      },
    })
    plugin.configResolved?.({ root: cwd } as never)

    const teardown = plugin.configureServer?.({
      ws: {
        send(payload: UpdateEvent) {
          sends.push(payload)
        },
      },
      moduleGraph: {
        getModulesByFile(file: string) {
          if (file === `${cwd}/.reference-ui/react/react.mjs`) {
            return new Set([module])
          }
          return undefined
        },
        invalidateModule,
      },
    } as never)

    const firstUpdate = await plugin.handleHotUpdate?.({
      file: `${cwd}/.reference-ui/react/react.mjs`,
    } as never)
    const secondUpdate = await plugin.handleHotUpdate?.({
      file: `${cwd}/.reference-ui/styled/styles.css`,
    } as never)
    const thirdUpdate = await plugin.handleHotUpdate?.({
      file: `${cwd}/.reference-ui/types/types.mjs`,
    } as never)

    expect(firstUpdate).toEqual([])
    expect(secondUpdate).toEqual([])
    expect(thirdUpdate).toEqual([])
    expect(sends).toEqual([])

    if (refreshHandler) {
      refreshHandler({ changedOutputs: [] })
    }

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

    if (refreshHandler) {
      refreshHandler({ changedOutputs: [] })
    }

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