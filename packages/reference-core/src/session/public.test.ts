import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_OUT_DIR } from '../constants'
import { getSyncSession } from './public'
import { writeManifest } from './files'
import type { SessionManifest } from './types'

const BASE_MANIFEST: SessionManifest = {
  pid: process.pid,
  mode: 'watch',
  state: 'watching',
  buildState: 'idle',
  startedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:01.000Z',
}

async function waitForCallCount(calls: unknown[], expectedCount: number, timeout = 1_000): Promise<void> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (calls.length >= expectedCount) return
    await new Promise(r => setTimeout(r, 25))
  }

  throw new Error(`Timed out waiting for ${expectedCount} refresh call(s); saw ${calls.length}`)
}

let rootDir: string
let outDir: string

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'ref-public-test-'))
  outDir = join(rootDir, DEFAULT_OUT_DIR)
  mkdirSync(outDir, { recursive: true })
})

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true })
})

describe('getSyncSession – discovery', () => {
  it('finds session.json when it is in cwd/default out dir', () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    const session = getSyncSession({ cwd: rootDir })

    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    // Discovery doesn't fire synchronously; dispose to clean up.
    session.dispose()

    // No error thrown means it resolved cwd correctly.
    expect(calls).toHaveLength(0)
  })

  it('respects an explicit outDir option instead of walking up from cwd', async () => {
    const customOutDir = join(rootDir, 'custom-out')
    mkdirSync(customOutDir, { recursive: true })
    writeManifest(customOutDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir, outDir: 'custom-out' })
    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    writeManifest(customOutDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await waitForCallCount(calls, 1)

    expect(calls.length).toBeGreaterThan(0)
    session.dispose()
  })

  it('returns a session object with onRefresh and dispose', () => {
    const session = getSyncSession({ cwd: rootDir })
    expect(typeof session.onRefresh).toBe('function')
    expect(typeof session.dispose).toBe('function')
    session.dispose()
  })
})

describe('getSyncSession – onRefresh', () => {
  it('onRefresh returns an unsubscribe function', () => {
    writeManifest(outDir, BASE_MANIFEST)
    const session = getSyncSession({ cwd: rootDir })
    const unsub = session.onRefresh(() => {})
    expect(typeof unsub).toBe('function')
    unsub()
    session.dispose()
  })

  it('fires onRefresh handlers when buildState transitions to ready', async () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir })
    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    // Simulate a ref sync writing ready state.
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })

    await waitForCallCount(calls, 1)

    expect(calls.length).toBeGreaterThan(0)
    expect((calls[0] as { changedOutputs: string[] }).changedOutputs).toEqual([])

    session.dispose()
  })

  it('does not re-fire onRefresh on consecutive ready states', async () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir })
    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await waitForCallCount(calls, 1)
    const firstCount = calls.length

    // Rewriting the same ready snapshot should not fire again.
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await new Promise(r => setTimeout(r, 100))

    expect(calls.length).toBe(firstCount)

    session.dispose()
  })

  it('fires again when a new ready snapshot is written', async () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir })
    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await waitForCallCount(calls, 1)

    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready', updatedAt: '2026-01-01T01:00:00.000Z' })
    await waitForCallCount(calls, 2)

    expect(calls.length).toBeGreaterThanOrEqual(2)

    session.dispose()
  })

  it('fires again after ready→idle→ready cycle', async () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir })
    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    // First ready
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await waitForCallCount(calls, 1)

    // Back to idle
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })
    await new Promise(r => setTimeout(r, 150))

    // Second ready
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready', updatedAt: '2026-01-01T02:00:00.000Z' })
    await waitForCallCount(calls, 2)

    expect(calls.length).toBeGreaterThanOrEqual(2)

    session.dispose()
  })

  it('unsubscribed handler is not called', async () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir })
    const calls: unknown[] = []
    const unsub = session.onRefresh(e => calls.push(e))
    unsub()

    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await new Promise(r => setTimeout(r, 100))

    expect(calls).toHaveLength(0)

    session.dispose()
  })

  it('fires onRefresh when getSyncSession is called before session.json exists (late-start)', async () => {
    // outDir exists but session.json has not been written yet — simulates a
    // bundler plugin that starts before ref sync creates the manifest.
    const session = getSyncSession({ cwd: rootDir })
    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    // Now ref sync "creates" the manifest with buildState=ready.
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await waitForCallCount(calls, 1)

    expect(calls.length).toBeGreaterThan(0)
    session.dispose()
  })
})

describe('getSyncSession – dispose', () => {
  it('stops firing after dispose', async () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir })
    const calls: unknown[] = []
    session.onRefresh(e => calls.push(e))

    session.dispose()

    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await new Promise(r => setTimeout(r, 100))

    expect(calls).toHaveLength(0)
  })

  it('dispose does not throw when called on a session with no session.json', () => {
    const session = getSyncSession({ cwd: rootDir })
    expect(() => session.dispose()).not.toThrow()
  })
})

describe('getSyncSession – handler isolation', () => {
  it('a throwing handler does not prevent other handlers from running', async () => {
    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'idle' })

    const session = getSyncSession({ cwd: rootDir })
    const good: unknown[] = []
    session.onRefresh(() => { throw new Error('bad handler') })
    session.onRefresh(e => good.push(e))

    writeManifest(outDir, { ...BASE_MANIFEST, buildState: 'ready' })
    await waitForCallCount(good, 1)

    expect(good.length).toBeGreaterThan(0)

    session.dispose()
  })
})
