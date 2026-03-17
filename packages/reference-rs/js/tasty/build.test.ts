import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildTasty } from './build'

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
})
