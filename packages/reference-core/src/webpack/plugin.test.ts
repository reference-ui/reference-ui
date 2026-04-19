import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_OUT_DIR } from '../constants'
import type { RefreshEvent, SyncSession } from '../session'
import { referenceWebpack } from './plugin'
import type { ReferenceWebpackCompiler } from './types'

describe('referenceWebpack', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ignores generated output roots and symlinked managed packages in watch mode', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-webpack-plugin-'))
    const plugin = referenceWebpack({
      internals: {
        subscribeToManagedOutputWrites: async () => ({
          unsubscribe() {},
        }),
      },
    })

    const compiler = createCompiler(cwd)
    plugin.apply(compiler)
    const ignored = compiler.options.watchOptions?.ignored as
      | ((path: string) => boolean)
      | undefined

    expect(compiler.options.cache).toBe(false)
    expect(compiler.options.resolve?.alias).toMatchObject({
      react: `${cwd}/node_modules/react`,
      'react-dom': `${cwd}/node_modules/react-dom`,
      scheduler: `${cwd}/node_modules/scheduler`,
      '@reference-ui/react': `${cwd}/node_modules/@reference-ui/react`,
      '@reference-ui/styled': `${cwd}/node_modules/@reference-ui/styled`,
      '@reference-ui/system': `${cwd}/node_modules/@reference-ui/system`,
      '@reference-ui/system/baseSystem': `${cwd}/node_modules/@reference-ui/system/baseSystem.mjs`,
      '@reference-ui/types': `${cwd}/node_modules/@reference-ui/types`,
    })
    expect(compiler.options.module?.unsafeCache).toBe(false)
    expect(compiler.options.snapshot?.managedPaths).toEqual([])
    expect(typeof ignored).toBe('function')
    expect(ignored?.(`${cwd}/${DEFAULT_OUT_DIR}/virtual/main.tsx`)).toBe(true)
    expect(ignored?.(`${cwd}/${DEFAULT_OUT_DIR}/mcp/model.json`)).toBe(true)
    expect(ignored?.(`${cwd}/${DEFAULT_OUT_DIR}/react/react.mjs`)).toBe(false)
    expect(ignored?.(`${cwd}/node_modules/@reference-ui/react/react.mjs`)).toBe(false)
    expect(ignored?.(`${cwd}/src/App.tsx`)).toBe(false)
  })

  it('coalesces rapid managed-output writes into one invalidate after sync ready', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-webpack-plugin-'))
    const invalidate = vi.fn()
    let refreshHandler: ((event: RefreshEvent) => void) | undefined
    let managedOutputWrite: ((file: string) => void) | undefined

    const session: SyncSession = {
      onRefresh(handler) {
        refreshHandler = handler
        return () => {
          if (refreshHandler === handler) {
            refreshHandler = undefined
          }
        }
      },
      dispose: vi.fn(),
    }

    const plugin = referenceWebpack({
      internals: {
        getSyncSession: () => session,
        subscribeToManagedOutputWrites: async (_projectPaths, onWrite) => {
          managedOutputWrite = onWrite
          return {
            unsubscribe() {},
          }
        },
      },
    })

    const compiler = createCompiler(cwd, invalidate)
    plugin.apply(compiler)
    await Promise.resolve()

    managedOutputWrite?.(`${cwd}/${DEFAULT_OUT_DIR}/react/react.mjs`)
    managedOutputWrite?.(`${cwd}/${DEFAULT_OUT_DIR}/styled/styles.css`)
    managedOutputWrite?.(`${cwd}/${DEFAULT_OUT_DIR}/types/types.d.ts`)

    expect(invalidate).not.toHaveBeenCalled()

    refreshHandler?.({ changedOutputs: [] })
    expect(invalidate).toHaveBeenCalledTimes(1)

    refreshHandler?.({ changedOutputs: [] })
    expect(invalidate).toHaveBeenCalledTimes(1)

    compiler.closeWatch()
    await Promise.resolve()
    expect(session.dispose).toHaveBeenCalledTimes(1)
  })
})

function createCompiler(cwd: string, invalidate = vi.fn()): ReferenceWebpackCompiler & {
  closeWatch(): void
} {
  let closeWatchHandler: (() => void) | undefined

  return {
    context: cwd,
    watching: {
      invalidate,
    },
    options: {},
    hooks: {
      watchClose: {
        tap(_name: string, handler: () => void) {
          closeWatchHandler = handler
        },
      },
    },
    closeWatch() {
      closeWatchHandler?.()
    },
  }
}