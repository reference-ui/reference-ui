import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getSyncSession, type GetSyncSessionOptions } from '@reference-ui/core'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const baseManifest = {
  pid: process.pid,
  mode: 'watch',
  state: 'watching',
  buildState: 'idle',
  startedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:01.000Z',
} as const

let rootDir: string
let outDir: string
let sessionFile: string

function createOptions(): GetSyncSessionOptions {
  return {
    cwd: rootDir,
    outDir,
  }
}

function writeManifest(overrides: Partial<typeof baseManifest>): void {
  mkdirSync(join(outDir, 'tmp'), { recursive: true })
  writeFileSync(
    sessionFile,
    JSON.stringify({
      ...baseManifest,
      ...overrides,
    }),
  )
}

async function waitForCallCount(calls: unknown[], expectedCount: number, timeout = 3_000): Promise<void> {
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    if (calls.length >= expectedCount) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  throw new Error(`Timed out waiting for ${expectedCount} refresh call(s); saw ${calls.length}`)
}

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'ref-matrix-session-'))
  outDir = join(rootDir, '.reference-ui')
  sessionFile = join(outDir, 'tmp', 'session.json')
  mkdirSync(join(outDir, 'tmp'), { recursive: true })
})

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true })
})

describe('session public API', () => {
  it('ignores a malformed session.json until a valid ready manifest appears', async () => {
    const session = getSyncSession(createOptions())
    const calls: unknown[] = []

    session.onRefresh((event) => calls.push(event))

    writeFileSync(sessionFile, '{ malformed json')
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(calls).toHaveLength(0)

    writeManifest({ buildState: 'ready' })
    await waitForCallCount(calls, 1)

    expect(calls).toHaveLength(1)
    session.dispose()
  })

  it('emits a refresh when the ready manifest appears after the watcher starts', async () => {
    const session = getSyncSession(createOptions())
    const calls: unknown[] = []

    session.onRefresh((event) => calls.push(event))

    writeManifest({ buildState: 'ready' })
    await waitForCallCount(calls, 1)

    expect(calls).toHaveLength(1)
    session.dispose()
  })

  it('notifies multiple observers for the same ready transition', async () => {
    writeManifest({ buildState: 'idle' })

    const session = getSyncSession(createOptions())
    const firstObserverCalls: unknown[] = []
    const secondObserverCalls: unknown[] = []

    session.onRefresh((event) => firstObserverCalls.push(event))
    session.onRefresh((event) => secondObserverCalls.push(event))

    writeManifest({ buildState: 'ready' })
    await Promise.all([
      waitForCallCount(firstObserverCalls, 1),
      waitForCallCount(secondObserverCalls, 1),
    ])

    expect(firstObserverCalls).toHaveLength(1)
    expect(secondObserverCalls).toHaveLength(1)
    session.dispose()
  })

  it('unsubscribes one observer without muting the remaining observers', async () => {
    writeManifest({ buildState: 'idle' })

    const session = getSyncSession(createOptions())
    const unsubscribedCalls: unknown[] = []
    const activeCalls: unknown[] = []

    const unsubscribe = session.onRefresh((event) => unsubscribedCalls.push(event))
    session.onRefresh((event) => activeCalls.push(event))

    unsubscribe()
    writeManifest({ buildState: 'ready' })
    await waitForCallCount(activeCalls, 1)

    expect(unsubscribedCalls).toHaveLength(0)
    expect(activeCalls).toHaveLength(1)
    session.dispose()
  })

  it('disposes idempotently and ignores later ready manifests after cleanup', async () => {
    writeManifest({ buildState: 'idle' })

    const session = getSyncSession(createOptions())
    const calls: unknown[] = []

    session.onRefresh((event) => calls.push(event))

    expect(() => {
      session.dispose()
      session.dispose()
    }).not.toThrow()

    writeManifest({
      buildState: 'ready',
      updatedAt: '2026-01-01T00:00:02.000Z',
    })
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(calls).toHaveLength(0)
  })
})
