import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildTasty, createTastyBuildSession } from './build'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')
const tastyDir = join(packageDir, 'tests', 'tasty')

describe('buildTasty', () => {
  it('builds emitted artifacts and returns a ready api', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-build-'))
    const outputDir = join(tempRoot, 'tasty-output')

    try {
      const built = await buildTasty({
        rootDir: tastyDir,
        include: ['cases/external_libs/input/**/*.{ts,tsx}'],
        outputDir,
      })

      expect(built.outputDir).toBe(outputDir)
      expect(built.manifestPath).toBe(join(outputDir, 'manifest.js'))
      expect(built.warnings).toEqual([])
      expect(existsSync(join(outputDir, 'manifest.js'))).toBe(true)
      expect(existsSync(join(outputDir, 'runtime.js'))).toBe(true)
      expect(existsSync(join(outputDir, 'chunk-registry.js'))).toBe(true)

      const symbol = await built.api.loadSymbolByName('ButtonProps')
      expect(symbol.getName()).toBe('ButtonProps')
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('stores build/session cache inside the tasty build layer', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-session-'))
    const outputDir = join(tempRoot, 'tasty-output')
    const session = createTastyBuildSession()

    try {
      const first = await session.rebuild('fixture', {
        rootDir: tastyDir,
        include: ['cases/external_libs/input/**/*.{ts,tsx}'],
        outputDir,
      })
      const cached = session.get('fixture')
      const ensured = await session.ensureReady('fixture')
      const reused = await session.getOrRebuild('fixture', {
        rootDir: tastyDir,
        include: ['cases/external_libs/input/**/*.{ts,tsx}'],
        outputDir,
      })

      expect(cached).toBe(first)
      expect(ensured).toBe(first)
      expect(reused).toBe(first)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })
})
