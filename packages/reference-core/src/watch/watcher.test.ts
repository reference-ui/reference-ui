import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getWatcherState,
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
})
