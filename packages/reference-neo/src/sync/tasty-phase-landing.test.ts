// Warm landing reports: a warm tasty run reports its warnings the way the cold build does. The tests run real sync
// over temp projects and replace only the tasty bridge, the same way tasty-refresh.test.ts does. A drained landing
// hands its count and diagnostics to the drainer, an undrained one prints the summary, a verbose one lists each
// warning with its code, and an undrained json one prints its diagnostics array.

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatWarningSummary } from '../diagnostics/index.ts'
import {
  getReferenceTastyBuild,
  initReference,
  rebuildReferenceTastyBuild,
  type ReferenceTastyBuildState,
} from '../reference/bridge/index.ts'
import { cleanDir } from './clean.ts'
import { sync } from './index.ts'
import { flushTastyLanding } from './tasty-phase.ts'

vi.mock('../reference/bridge/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../reference/bridge/index.ts')>()
  return {
    ...actual,
    initReference: vi.fn(),
    getReferenceTastyBuild: vi.fn(),
    rebuildReferenceTastyBuild: vi.fn(),
  }
})

const WARNING_CODE = 'TST-W-MISSING-TYPE'
const WARM_BUILD: ReferenceTastyBuildState = {
  sourceDir: '',
  outputDir: '',
  manifestPath: '',
  warnings: [],
  diagnostics: [
    {
      level: 'warning',
      source: 'scanner',
      code: WARNING_CODE,
      message: 'cannot find type Missing',
      file: 'theme/dangling.ts',
      line: 1,
      column: 1,
    },
  ],
  api: {} as ReferenceTastyBuildState['api'],
}
const tempDirs: string[] = []

const CONFIG = [
  "import { defineConfig } from '@reference-ui/neo'",
  '',
  'export default defineConfig({',
  "  name: 'tasty-landing-test',",
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
  const dir = await mkdtemp(join(tmpdir(), 'neo-tasty-landing-'))
  tempDirs.push(dir)
  await mkdir(join(dir, 'theme'), { recursive: true })
  await writeFile(join(dir, 'ui.config.ts'), CONFIG)
  await writeFile(join(dir, 'theme', 'tokens.ts'), TOKENS)
  return dir
}

// A landed manifest, as an earlier build leaves it, so the sync takes the warm path.
async function seedManifest(dir: string): Promise<void> {
  const tastyDir = join(dir, '.reference-ui', 'types', 'tasty')
  await mkdir(tastyDir, { recursive: true })
  await writeFile(join(tastyDir, 'manifest.js'), 'export default {}\n')
}

// The json lines a test printed on stdout that are diagnostics arrays.
function printedArrays(calls: readonly (readonly unknown[])[]): unknown[] {
  return calls
    .map(([line]) => String(line))
    .filter((line) => line.startsWith('['))
    .map((line) => JSON.parse(line) as unknown)
}

describe('sync tasty warm landing reports', () => {
  it('hands a drained landing its count and diagnostics, with no summary printed', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      await sync(dir, { foldRefDiagnostics: true })
      const landing = await flushTastyLanding(dir)
      expect(landing).toMatchObject({
        status: 'complete',
        reportedWarningCount: 1,
        diagnostics: [expect.objectContaining({ code: WARNING_CODE })],
      })
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  }, 30_000)

  it('lists each warning with its code under verbose, and the drainer still gets the count', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      await sync(dir, { verbose: true, foldRefDiagnostics: true })
      await expect(flushTastyLanding(dir)).resolves.toMatchObject({ status: 'complete', reportedWarningCount: 1 })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(WARNING_CODE))
    } finally {
      warn.mockRestore()
    }
  }, 30_000)

  it('prints the warning summary for an undrained landing, as a background landing does', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      await sync(dir)
      await vi.waitFor(() => expect(warn).toHaveBeenCalledWith(formatWarningSummary(1)))
    } finally {
      warn.mockRestore()
    }
  }, 30_000)

  it('prints an undrained json landing as one diagnostics array on stdout', async () => {
    const dir = await writeProject()
    await seedManifest(dir)
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      await sync(dir, { json: true })
      await vi.waitFor(() => expect(printedArrays(log.mock.calls)).toHaveLength(1))
      expect(printedArrays(log.mock.calls)).toEqual([[expect.objectContaining({ code: WARNING_CODE, severity: 'warning' })]])
    } finally {
      log.mockRestore()
      warn.mockRestore()
    }
  }, 30_000)
})
