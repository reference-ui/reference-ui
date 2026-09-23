import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getWatcherState,
  handleWatchEvents,
  startWatcher,
  type WatchCallbacks,
} from './watcher'

function createTempWorkspace(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), 'reference-watcher-test-')))
}

describe('watch/watcher', () => {
  const rootsToDelete: string[] = []

  afterEach(async () => {
    const toDelete = rootsToDelete.splice(0)
    await Promise.all(
      toDelete.map((root) => rm(root, { recursive: true, force: true })),
    )
  })

  it('derives watcher state with watchRoots and dependencyPaths', () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    mkdirSync(join(workspace, 'src'), { recursive: true })
    const configPath = join(workspace, 'ui.config.ts')
    writeFileSync(configPath, 'export default {}\n', 'utf-8')

    const state = getWatcherState({
      projectRoot: workspace,
      config: {
        include: ['src/**/*.{ts,tsx}'],
        dependencyPaths: [configPath],
      },
    })

    expect(state.include).toEqual(['src/**/*.{ts,tsx}'])
    expect(state.dependencyPaths).toEqual([configPath])
    expect(state.watchRoots).toEqual([workspace])
  })

  it('subscribes with parcel watcher and detects file changes matching include', async () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    const srcDir = join(workspace, 'src')
    mkdirSync(srcDir, { recursive: true })
    const componentFile = join(srcDir, 'Button.tsx')
    writeFileSync(componentFile, 'export const Button = () => null\n', 'utf-8')

    const onChange = vi.fn()
    const onError = vi.fn()
    const callbacks: WatchCallbacks = { onChange, onError }

    const subscription = await startWatcher(
      {
        projectRoot: workspace,
        config: {
          include: ['src/**/*.{ts,tsx}'],
        },
      },
      callbacks,
    )

    try {
      await new Promise((r) => setTimeout(r, 100))
      writeFileSync(componentFile, 'export const Button = () => <div>Hello</div>\n', 'utf-8')
      await new Promise((r) => setTimeout(r, 500))

      expect(onChange).toHaveBeenCalled()
      const matchingCall = onChange.mock.calls.find((call) => call[0].path === componentFile)
      expect(matchingCall).toBeDefined()
      expect(matchingCall![0].requiresFullResync).toBe(false)
    } finally {
      await subscription.unsubscribe()
    }
  })

  it('sets requiresFullResync: true when changed file is in dependencyPaths', async () => {
    const workspace = createTempWorkspace()
    rootsToDelete.push(workspace)
    const srcDir = join(workspace, 'src')
    mkdirSync(srcDir, { recursive: true })
    const configPath = join(workspace, 'ui.config.ts')
    writeFileSync(configPath, 'export default { theme: "light" }\n', 'utf-8')

    const onChange = vi.fn()
    const onError = vi.fn()
    const callbacks: WatchCallbacks = { onChange, onError }

    const subscription = await startWatcher(
      {
        projectRoot: workspace,
        config: {
          include: ['src/**/*.{ts,tsx}'],
          dependencyPaths: [configPath],
        },
      },
      callbacks,
    )

    try {
      await new Promise((r) => setTimeout(r, 100))
      writeFileSync(configPath, 'export default { theme: "dark" }\n', 'utf-8')
      await new Promise((r) => setTimeout(r, 500))

      expect(onChange).toHaveBeenCalled()
      const matchingCall = onChange.mock.calls.find((call) => call[0].path === configPath)
      expect(matchingCall).toBeDefined()
      expect(matchingCall![0].requiresFullResync).toBe(true)
    } finally {
      await subscription.unsubscribe()
    }
  })

  describe('handleWatchEvents', () => {
    const projectRoot = '/workspace/test-app'

    it('forwards error to callbacks.onError and halts event processing', () => {
      const onError = vi.fn()
      const onChange = vi.fn()
      const error = new Error('Parcel watcher error')

      handleWatchEvents(error, [{ type: 'create', path: `${projectRoot}/src/Button.tsx` }], {
        projectRoot,
        isMatch: () => true,
        dependencyPathSet: new Set(),
        callbacks: { onError, onChange },
      })

      expect(onError).toHaveBeenCalledWith(error)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('handles undefined or empty events gracefully', () => {
      const onError = vi.fn()
      const onChange = vi.fn()

      handleWatchEvents(null, undefined, {
        projectRoot,
        isMatch: () => true,
        dependencyPathSet: new Set(),
        callbacks: { onError, onChange },
      })

      handleWatchEvents(null, [], {
        projectRoot,
        isMatch: () => true,
        dependencyPathSet: new Set(),
        callbacks: { onError, onChange },
      })

      expect(onError).not.toHaveBeenCalled()
      expect(onChange).not.toHaveBeenCalled()
    })

    it('filters out files that do not match include pattern and are not dependencies', () => {
      const onError = vi.fn()
      const onChange = vi.fn()

      handleWatchEvents(
        null,
        [
          { type: 'update', path: `${projectRoot}/node_modules/pkg/index.js` },
          { type: 'create', path: `${projectRoot}/README.md` },
        ],
        {
          projectRoot,
          isMatch: (rel) => rel.startsWith('src/'),
          dependencyPathSet: new Set(),
          callbacks: { onError, onChange },
        },
      )

      expect(onChange).not.toHaveBeenCalled()
    })

    it('maps parcel event types to reference FileEvents (create -> add, update -> change, delete -> unlink)', () => {
      const onChange = vi.fn()

      handleWatchEvents(
        null,
        [
          { type: 'create', path: `${projectRoot}/src/New.tsx` },
          { type: 'update', path: `${projectRoot}/src/Existing.tsx` },
          { type: 'delete', path: `${projectRoot}/src/Old.tsx` },
        ],
        {
          projectRoot,
          isMatch: (rel) => rel.startsWith('src/'),
          dependencyPathSet: new Set(),
          callbacks: { onError: vi.fn(), onChange },
        },
      )

      expect(onChange).toHaveBeenCalledTimes(3)
      expect(onChange).toHaveBeenNthCalledWith(1, {
        event: 'add',
        path: `${projectRoot}/src/New.tsx`,
        relativePath: 'src/New.tsx',
        requiresFullResync: false,
      })
      expect(onChange).toHaveBeenNthCalledWith(2, {
        event: 'change',
        path: `${projectRoot}/src/Existing.tsx`,
        relativePath: 'src/Existing.tsx',
        requiresFullResync: false,
      })
      expect(onChange).toHaveBeenNthCalledWith(3, {
        event: 'unlink',
        path: `${projectRoot}/src/Old.tsx`,
        relativePath: 'src/Old.tsx',
        requiresFullResync: false,
      })
    })

    it('sets requiresFullResync: true when changed file matches dependencyPathSet', () => {
      const onChange = vi.fn()
      const configPath = `${projectRoot}/ui.config.ts`

      handleWatchEvents(
        null,
        [{ type: 'update', path: configPath }],
        {
          projectRoot,
          isMatch: (rel) => rel.startsWith('src/'), // config is outside src/ so isMatch is false
          dependencyPathSet: new Set([configPath]),
          callbacks: { onError: vi.fn(), onChange },
        },
      )

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({
        event: 'change',
        path: configPath,
        relativePath: 'ui.config.ts',
        requiresFullResync: true,
      })
    })
  })
})
