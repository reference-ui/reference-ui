// Warm tasty refresh failure proofs: a warm run that throws leaves its failure for the caller that drains the landing,
// the drain waits for the lane to run dry before it reports, an undrained sync keeps the background line, and the next
// run that lands clears the failure. Real sync runs over temp projects; only the tasty bridge is replaced, the same way
// tasty-refresh.test.ts replaces it.

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getReferenceTastyBuild,
  initReference,
  rebuildReferenceTastyBuild,
  type ReferenceTastyBuildState,
} from '../reference/bridge/index.ts'
import { cleanDir } from './clean.ts'
import { sync } from './index.ts'
import { flushTastyRefresh } from './tasty-phase.ts'

vi.mock('../reference/bridge/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../reference/bridge/index.ts')>()
  return {
    ...actual,
    initReference: vi.fn(),
    getReferenceTastyBuild: vi.fn(),
    rebuildReferenceTastyBuild: vi.fn(),
  }
})

const WARM_BUILD = {} as ReferenceTastyBuildState
const FAILURE = 'scan exploded'
const BACKGROUND_LINE = '[neo] [ref] background tasty refresh failed'
const tempDirs: string[] = []

const CONFIG = [
  "import { defineConfig } from '@reference-ui/neo'",
  '',
  'export default defineConfig({',
  "  name: 'tasty-refresh-failure-test',",
  "  include: ['theme/**/*.{ts,tsx}'],",
  '})',
  '',
].join('\n')

const TOKENS = [
  "import { tokens } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  colors: {',
  "    brand: { value: '#7c3aed' },",
  '  },',
  '})',
  '',
].join('\n')

beforeEach(() => {
  vi.mocked(initReference).mockReset()
  vi.mocked(getReferenceTastyBuild).mockReset()
  vi.mocked(getReferenceTastyBuild).mockReturnValue(WARM_BUILD)
  vi.mocked(rebuildReferenceTastyBuild).mockReset()
  vi.mocked(rebuildReferenceTastyBuild).mockResolvedValue(WARM_BUILD)
})

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => cleanDir(dir)))
})

async function writeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-tasty-refresh-failure-'))
  tempDirs.push(dir)
  await mkdir(join(dir, 'theme'), { recursive: true })
  await writeFile(join(dir, 'ui.config.ts'), CONFIG)
  await writeFile(join(dir, 'theme', 'tokens.ts'), TOKENS)
  return dir
}

// A landed manifest, as an earlier build leaves it. Sync keeps the tasty dir, so it is still there after sync.
async function seedManifest(dir: string): Promise<void> {
  const tastyDir = join(dir, '.reference-ui', 'types', 'tasty')
  await mkdir(tastyDir, { recursive: true })
  await writeFile(join(tastyDir, 'manifest.js'), 'export default {}\n')
}

// Two turns of setImmediate: enough for a loop-deferred run to start.
async function drainLoop(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
  await new Promise((resolve) => setImmediate(resolve))
}

describe('sync tasty refresh failures', () => {
  it('hands a drained warm failure to the drainer and keeps it off the background line', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    vi.mocked(rebuildReferenceTastyBuild).mockRejectedValueOnce(new Error(FAILURE))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    try {
      await sync(dir, { foldRefDiagnostics: true })
      await expect(flushTastyRefresh(dir)).resolves.toEqual({ status: 'failed', message: FAILURE })
      expect(errors).not.toHaveBeenCalledWith(expect.stringContaining(BACKGROUND_LINE))
    } finally {
      errors.mockRestore()
    }
  }, 30_000)

  it('keeps the background line for an undrained warm failure', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    vi.mocked(rebuildReferenceTastyBuild).mockRejectedValueOnce(new Error(FAILURE))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    try {
      await sync(dir)
      await vi.waitFor(() => expect(errors).toHaveBeenCalledWith(`${BACKGROUND_LINE}: ${FAILURE}`))
    } finally {
      errors.mockRestore()
    }
  }, 30_000)

  it('reports nothing until the lane runs dry, then reports the failure of its last run', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    const rejectRun: { reject?: (reason: Error) => void } = {}
    vi.mocked(rebuildReferenceTastyBuild).mockImplementationOnce(
      () =>
        new Promise<ReferenceTastyBuildState>((_resolve, reject) => {
          rejectRun.reject = reject
        })
    )

    await sync(dir, { foldRefDiagnostics: true })
    await vi.waitFor(() => expect(rebuildReferenceTastyBuild).toHaveBeenCalledTimes(1))
    let reported: unknown = 'pending'
    void flushTastyRefresh(dir).then((value) => {
      reported = value
    })
    await drainLoop()
    expect(reported).toBe('pending')

    rejectRun.reject?.(new Error(FAILURE))
    await vi.waitFor(() => expect(reported).toEqual({ status: 'failed', message: FAILURE }))
  }, 30_000)

  it('clears the failure once a later run lands', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    vi.mocked(rebuildReferenceTastyBuild).mockRejectedValueOnce(new Error(FAILURE))

    await sync(dir, { foldRefDiagnostics: true })
    await expect(flushTastyRefresh(dir)).resolves.toEqual({ status: 'failed', message: FAILURE })

    await sync(dir, { foldRefDiagnostics: true })
    await expect(flushTastyRefresh(dir)).resolves.toBeUndefined()
    expect(rebuildReferenceTastyBuild).toHaveBeenCalledTimes(2)
  }, 60_000)
})
