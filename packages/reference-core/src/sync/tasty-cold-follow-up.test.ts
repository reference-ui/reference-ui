// Cold tasty build follow-up proofs: a save that lands while the cold build is pending must reach the
// manifest through one follow-up once that build settles, and a plain boot must build exactly once.
// Real sync and the real bridge scheduler run over temp projects; only the tasty build is replaced. A fake
// build reads the project when it starts, the way the scanner does, and settles only when the test says so,
// which pins the pending window without timing luck.

import { readFileSync } from 'node:fs'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getReferenceTastyBuild,
  rebuildReferenceTastyBuild,
  type ReferenceTastyBuildState,
} from '../reference/bridge/tasty-build.ts'
import { cleanDir } from './clean.ts'
import { sync } from './index.ts'

vi.mock('../reference/bridge/tasty-build.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../reference/bridge/tasty-build.ts')>()
  return {
    ...actual,
    getReferenceTastyBuild: vi.fn(),
    rebuildReferenceTastyBuild: vi.fn(),
  }
})

// The file a fake build scans: each line is one symbol name, so a later line is a later symbol.
const SCAN_SOURCE = 'scan-source.txt'
const SOURCE_V1 = 'ButtonProps\n'
const LATER_SAVE = 'LaterProps\n'
const AGAIN_SAVE = 'AgainProps\n'

const CONFIG = [
  "import { defineConfig } from '@reference-ui/core'",
  '',
  'export default defineConfig({',
  "  name: 'cold-follow-up-test',",
  "  include: ['theme/**/*.{ts,tsx}'],",
  '})',
  '',
].join('\n')

const TOKENS = [
  "import { tokens } from '@reference-ui/core'",
  '',
  'tokens({',
  '  colors: {',
  "    brand: { value: '#7c3aed' },",
  '  },',
  '})',
  '',
].join('\n')

// A build that has started: what it scanned, and how the test settles or fails it.
interface StartedBuild {
  scanned: string
  settle: () => void
  fail: (reason: Error) => void
}

interface FakeBuildState extends ReferenceTastyBuildState {
  scanned: string
}

const started: StartedBuild[] = []
const cache = new Map<string, FakeBuildState>()
const tempDirs: string[] = []

function fakeBuildState(sourceDir: string, scanned: string): FakeBuildState {
  const outputDir = join(sourceDir, '.reference-ui', 'types', 'tasty')
  return {
    sourceDir,
    outputDir,
    manifestPath: join(outputDir, 'manifest.js'),
    warnings: [],
    diagnostics: [],
    api: {} as ReferenceTastyBuildState['api'],
    scanned,
  }
}

// The scan reads the project synchronously as the build starts; settling caches the state before the
// caller resumes, the same order the session uses.
function fakeRebuild(payload: { sourceDir: string }): Promise<ReferenceTastyBuildState> {
  const sourceDir = resolve(payload.sourceDir)
  const scanned = readFileSync(join(sourceDir, SCAN_SOURCE), 'utf8')
  return new Promise((resolveBuild, rejectBuild) => {
    started.push({
      scanned,
      settle: () => {
        const state = fakeBuildState(sourceDir, scanned)
        cache.set(sourceDir, state)
        resolveBuild(state)
      },
      fail: (reason) => rejectBuild(reason),
    })
  })
}

beforeEach(() => {
  started.length = 0
  cache.clear()
  vi.mocked(rebuildReferenceTastyBuild).mockReset()
  vi.mocked(rebuildReferenceTastyBuild).mockImplementation(fakeRebuild)
  vi.mocked(getReferenceTastyBuild).mockReset()
  vi.mocked(getReferenceTastyBuild).mockImplementation((sourceDir) => cache.get(resolve(sourceDir)))
})

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => cleanDir(dir)))
})

async function writeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-cold-follow-up-'))
  tempDirs.push(dir)
  await mkdir(join(dir, 'theme'), { recursive: true })
  await writeFile(join(dir, 'ui.config.ts'), CONFIG)
  await writeFile(join(dir, 'theme', 'tokens.ts'), TOKENS)
  await writeFile(join(dir, SCAN_SOURCE), SOURCE_V1)
  return dir
}

// Lets any follow-up that would start run: the settle chain takes microtasks and one loop turn.
async function settleLoop(): Promise<void> {
  for (let turn = 0; turn < 3; turn += 1) await new Promise((resolveTurn) => setImmediate(resolveTurn))
  await new Promise((resolveTimer) => setTimeout(resolveTimer, 25))
}

describe('cold tasty build: saves that land while it is pending', () => {
  it('a plain boot builds exactly once: nothing follows the cold build', async () => {
    const dir = await writeProject()

    await sync(dir)
    await vi.waitFor(() => expect(started).toHaveLength(1))
    started[0]?.settle()
    await settleLoop()

    expect(started).toHaveLength(1)
    expect(started[0]?.scanned).toBe(SOURCE_V1)
  }, 30_000)

  it('a save that lands while the cold build is pending reaches the manifest through one follow-up', async () => {
    const dir = await writeProject()

    await sync(dir)
    await vi.waitFor(() => expect(started).toHaveLength(1))
    await writeFile(join(dir, SCAN_SOURCE), SOURCE_V1 + LATER_SAVE)
    await sync(dir)
    await settleLoop()
    expect(started).toHaveLength(1)

    started[0]?.settle()
    await vi.waitFor(() => expect(started).toHaveLength(2))
    started[1]?.settle()
    await settleLoop()

    expect(started).toHaveLength(2)
    expect(started[1]?.scanned).toBe(SOURCE_V1 + LATER_SAVE)
    expect(cache.get(resolve(dir))?.scanned).toBe(SOURCE_V1 + LATER_SAVE)
  }, 30_000)

  it('saves that land during one cold build coalesce into one follow-up', async () => {
    const dir = await writeProject()

    await sync(dir)
    await vi.waitFor(() => expect(started).toHaveLength(1))
    await writeFile(join(dir, SCAN_SOURCE), SOURCE_V1 + LATER_SAVE)
    await sync(dir)
    await writeFile(join(dir, SCAN_SOURCE), SOURCE_V1 + LATER_SAVE + AGAIN_SAVE)
    await sync(dir)

    started[0]?.settle()
    await vi.waitFor(() => expect(started).toHaveLength(2))
    started[1]?.settle()
    await settleLoop()

    expect(started).toHaveLength(2)
    expect(started[1]?.scanned).toBe(SOURCE_V1 + LATER_SAVE + AGAIN_SAVE)
  }, 30_000)

  it('a failed cold build drops its follow-up, and the next sync builds fresh', async () => {
    const dir = await writeProject()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    try {
      await sync(dir)
      await vi.waitFor(() => expect(started).toHaveLength(1))
      await writeFile(join(dir, SCAN_SOURCE), SOURCE_V1 + LATER_SAVE)
      await sync(dir)

      started[0]?.fail(new Error('scan exploded'))
      await settleLoop()
      expect(started).toHaveLength(1)

      await sync(dir)
      await vi.waitFor(() => expect(started).toHaveLength(2))
      expect(started[1]?.scanned).toBe(SOURCE_V1 + LATER_SAVE)
      started[1]?.settle()
      await settleLoop()
      expect(cache.get(resolve(dir))?.scanned).toBe(SOURCE_V1 + LATER_SAVE)
    } finally {
      errors.mockRestore()
    }
  }, 30_000)
})
