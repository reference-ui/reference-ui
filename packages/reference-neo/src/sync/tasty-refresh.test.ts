// Warm tasty refresh proofs: they take temp projects, a bridge mock for the session cache and the rebuild,
// and real sync runs. They assert that a warm sync queues a background rebuild even when the manifest already
// exists, that a cold sync leaves the first build to initReference, and that a sync landing mid-rebuild
// coalesces into exactly one follow-up run that never overlaps the run in flight.

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
const tempDirs: string[] = []

const CONFIG = [
  "import { defineConfig } from '@reference-ui/neo'",
  '',
  'export default defineConfig({',
  "  name: 'tasty-refresh-test',",
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
  vi.mocked(rebuildReferenceTastyBuild).mockReset()
  vi.mocked(rebuildReferenceTastyBuild).mockResolvedValue(WARM_BUILD)
})

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => cleanDir(dir)))
})

async function writeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-tasty-refresh-'))
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

// Two turns of setImmediate: enough for a loop-deferred run to start and for its settled work to chain.
async function drainLoop(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
  await new Promise((resolve) => setImmediate(resolve))
}

describe('sync tasty refresh', () => {
  it('queues a background rebuild on a warm sync even when the manifest already exists', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    vi.mocked(getReferenceTastyBuild).mockReturnValue(WARM_BUILD)

    await sync(dir)

    await vi.waitFor(() => expect(rebuildReferenceTastyBuild).toHaveBeenCalledTimes(1))
    expect(rebuildReferenceTastyBuild).toHaveBeenCalledWith(expect.objectContaining({ sourceDir: dir }))
  }, 30_000)

  it('leaves the first build to initReference when the session holds no build yet', async () => {
    const dir = await writeProject()
    await seedManifest(dir)

    await sync(dir)
    await drainLoop()

    expect(initReference).toHaveBeenCalledTimes(1)
    expect(rebuildReferenceTastyBuild).not.toHaveBeenCalled()
  }, 30_000)

  it('coalesces a sync that lands mid-rebuild into one follow-up run that never overlaps', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    vi.mocked(getReferenceTastyBuild).mockReturnValue(WARM_BUILD)
    const landings: Array<() => void> = []
    let inFlight = 0
    let maxInFlight = 0
    vi.mocked(rebuildReferenceTastyBuild).mockImplementation(
      () =>
        new Promise<ReferenceTastyBuildState>((resolve) => {
          inFlight += 1
          maxInFlight = Math.max(maxInFlight, inFlight)
          landings.push(() => {
            inFlight -= 1
            resolve(WARM_BUILD)
          })
        })
    )

    await sync(dir)
    await vi.waitFor(() => expect(landings).toHaveLength(1))
    await sync(dir)
    await sync(dir)
    await drainLoop()
    expect(landings).toHaveLength(1)

    landings[0]?.()
    await vi.waitFor(() => expect(landings).toHaveLength(2))
    landings[1]?.()
    await drainLoop()

    expect(rebuildReferenceTastyBuild).toHaveBeenCalledTimes(2)
    expect(maxInFlight).toBe(1)
  }, 60_000)
})
