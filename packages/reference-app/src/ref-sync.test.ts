import { describe, it } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

/**
 * These tests run after globalSetup, which runs `ref sync` once then
 * spawns `ref sync --watch` in the background. This suite verifies
 * the precursor worked and the design system is ready.
 */
describe('ref sync (precursor: setup runs ref sync + ref sync --watch)', () => {
  it('ref sync runs successfully', { timeout: 10_000 }, () => {
    execSync('ref sync', {
      cwd: pkgRoot,
      stdio: 'pipe',
      timeout: 8_000,
    })
  })
})
