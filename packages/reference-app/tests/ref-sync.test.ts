import { describe, it, expect } from 'vitest'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const virtualDir = join(pkgRoot, '.reference-ui', 'virtual')

/**
 * globalSetup runs ref sync once before all tests.
 * This suite verifies the design system output is ready.
 */
describe('ref sync', () => {
  it('creates .reference-ui/virtual directory with copied files', () => {
    expect(existsSync(virtualDir), `.reference-ui/virtual should exist`).toBe(true)

    const topLevel = readdirSync(virtualDir)
    expect(topLevel.length, `.reference-ui/virtual should contain entries (e.g. src/)`).toBeGreaterThan(0)
    expect(topLevel, `.reference-ui/virtual should include src/ from include patterns`).toContain('src')
  })
})
