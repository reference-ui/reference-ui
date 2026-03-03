import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const virtualDir = join(pkgRoot, '.reference-ui', 'virtual')

/**
 * These tests run after globalSetup, which runs `ref sync` once.
 * This suite verifies the precursor worked and the design system is ready.
 */
describe('ref sync (precursor: setup runs ref sync)', () => {
  it('ref sync runs successfully', { timeout: 10_000 }, () => {
    execSync('pnpm exec ref sync', {
      cwd: pkgRoot,
      stdio: 'pipe',
      timeout: 8_000,
    })
  })

  it('creates .reference-ui/virtual directory with copied files', () => {
    expect(existsSync(virtualDir), `.reference-ui/virtual should exist`).toBe(true)

    const topLevel = readdirSync(virtualDir)
    expect(topLevel.length, `.reference-ui/virtual should contain entries (e.g. src/)`).toBeGreaterThan(0)
    expect(topLevel, `.reference-ui/virtual should include src/ from include patterns`).toContain('src')
  })
})
