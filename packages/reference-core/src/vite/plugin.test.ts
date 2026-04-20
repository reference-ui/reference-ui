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
  closeBundle?: () => void
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
    const scenario = setupManagedRuntimeModuleScenario()

    await Promise.resolve()

    const [firstUpdate, secondUpdate, thirdUpdate] = await triggerManagedOutputUpdates(
      scenario.plugin,
      scenario.cwd,
    )

    expect(firstUpdate).toEqual([])
    expect(secondUpdate).toEqual([])
    expect(thirdUpdate).toEqual([])
    expect(scenario.sends).toEqual([])

    scenario.emitRefresh()

    expectManagedReactModuleUpdate(scenario.sends)
    expect(scenario.invalidateModule).toHaveBeenCalledTimes(1)

    scenario.emitRefresh()

    expect(scenario.sends).toHaveLength(1)

    scenario.teardown?.()
    expect(scenario.dispose).toHaveBeenCalledTimes(1)
  })

  it('defers project source-module HMR until sync ready', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))
    mkdirSync(join(cwd, 'src', 'cosmos'), { recursive: true })
    writeFileSync(join(cwd, 'src', 'cosmos', 'HmrSmoke.fixture.tsx'), 'export default function Fixture() { return null }\n')

    const sends: UpdateEvent[] = []
    const { dispose, emitRefresh, session } = createTestSession()

    const sourceModule = {
      url: '/src/cosmos/HmrSmoke.fixture.tsx',
      type: 'js' as const,
    }

    const invalidateModule = vi.fn()
    const { plugin, teardown } = setupManagedVitePlugin({
      cwd,
      invalidateModule,
      modulesByFile: {
        [`${cwd}/src/cosmos/HmrSmoke.fixture.tsx`]: new Set([sourceModule]),
      },
      sends,
      session,
    })

    await Promise.resolve()

    const result = await plugin.handleHotUpdate?.({
      file: `${cwd}/src/cosmos/HmrSmoke.fixture.tsx`,
      modules: [sourceModule],
    } as never)

    expect(result).toEqual([])
    expect(sends).toEqual([])

    emitRefresh()

    expect(sends).toEqual([
      {
        type: 'update',
        updates: [
          {
            type: 'js-update',
            path: '/src/cosmos/HmrSmoke.fixture.tsx',
            acceptedPath: '/src/cosmos/HmrSmoke.fixture.tsx',
            timestamp: expect.any(Number),
          },
        ],
      },
    ])
    expect(invalidateModule).toHaveBeenCalledTimes(1)

    teardown?.()
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('flushes subscribed managed css writes after sync ready even without Vite hot-update callbacks', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))

    const sends: UpdateEvent[] = []
    const { dispose, emitRefresh, session } = createTestSession()

    const cssModule = {
      url: '/@fs/.reference-ui/react/styles.css',
      type: 'css' as const,
    }

    const invalidateModule = vi.fn()
    let managedOutputWrite: ((file: string) => void) | undefined

    const { teardown } = setupManagedVitePlugin({
      cwd,
      invalidateModule,
      modulesByFile: {
        [`${cwd}/${DEFAULT_OUT_DIR}/react/styles.css`]: new Set([cssModule]),
      },
      sends,
      session,
      subscribeToManagedOutputWrites: async (_projectPaths, onWrite) => {
        managedOutputWrite = onWrite
        return {
          unsubscribe() {},
        }
      },
    })

    await Promise.resolve()

    managedOutputWrite?.(`${cwd}/${DEFAULT_OUT_DIR}/react/styles.css`)

    expect(sends).toEqual([])

    emitRefresh()

    expect(sends).toEqual([
      {
        type: 'update',
        updates: [
          {
            type: 'css-update',
            path: '/@fs/.reference-ui/react/styles.css',
            acceptedPath: '/@fs/.reference-ui/react/styles.css',
            timestamp: expect.any(Number),
          },
        ],
      },
    ])
    expect(invalidateModule).toHaveBeenCalledTimes(1)

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
  modulesByFile: Record<string, Set<{ url: string; type: 'js' | 'css' }>>
  sends: UpdateEvent[]
  session: SyncSession
  subscribeToManagedOutputWrites?: (
    projectPaths: { projectRoot: string; outDir: string; managedOutputRoots: Set<string> },
    onWrite: (file: string) => void
  ) => Promise<{ unsubscribe(): void }>
}): { plugin: TestableReferenceVitePlugin; teardown: (() => void) | void } {
  const plugin = testableReferenceVite({
    internals: {
      getSyncSession: () => options.session,
      subscribeToManagedOutputWrites: options.subscribeToManagedOutputWrites,
    },
  })
  plugin.configResolved?.({ root: options.cwd })

  return {
    plugin,
    teardown: (() => {
      plugin.closeBundle?.()
    }),
    ...(() => {
      plugin.configureServer?.({
        ws: {
          send(payload: UpdateEvent) {
            options.sends.push(payload)
          },
        },
        moduleGraph: {
          getModulesByFile(file: string) {
            return options.modulesByFile[file]
          },
          invalidateModule: options.invalidateModule,
        },
        httpServer: {
          once() {},
        },
      })

      return {}
    })(),
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

function setupManagedRuntimeModuleScenario(): {
  cwd: string
  dispose: ReturnType<typeof vi.fn>
  emitRefresh(): void
  invalidateModule: ReturnType<typeof vi.fn>
  plugin: TestableReferenceVitePlugin
  sends: UpdateEvent[]
  teardown: (() => void) | void
} {
  const cwd = mkdtempSync(join(tmpdir(), 'ref-vite-plugin-'))
  mkdirSync(join(cwd, DEFAULT_OUT_DIR, 'react'), { recursive: true })
  writeFileSync(join(cwd, DEFAULT_OUT_DIR, 'react', 'react.mjs'), 'export {}\n')

  const sends: UpdateEvent[] = []
  const { dispose, emitRefresh, session } = createTestSession()
  const invalidateModule = vi.fn()
  const module = {
    url: '/@fs/react.mjs',
    type: 'js' as const,
  }

  const { plugin, teardown } = setupManagedVitePlugin({
    cwd,
    invalidateModule,
    modulesByFile: {
      [`${cwd}/${DEFAULT_OUT_DIR}/react/react.mjs`]: new Set([module]),
    },
    sends,
    session,
  })

  return {
    cwd,
    dispose,
    emitRefresh,
    invalidateModule,
    plugin,
    sends,
    teardown,
  }
}

function expectManagedReactModuleUpdate(sends: UpdateEvent[]): void {
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
}