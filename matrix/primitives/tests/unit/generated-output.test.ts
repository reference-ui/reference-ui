import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..', '..')
const refUiDir = join(packageRoot, '.reference-ui')
const reactStylesheetPath = join(refUiDir, 'react', 'styles.css')
const virtualFixtureSourcePath = join(refUiDir, 'virtual', 'src', 'primitiveCssPropFixture.ts')
const fixtureSourcePath = join(packageRoot, 'src', 'primitiveCssPropFixture.ts')

function runRefSync(): void {
  try {
    execFileSync('pnpm', ['exec', 'ref', 'sync'], {
      cwd: packageRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    })
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

    throw new Error(
      ['ref sync failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n'),
    )
  }
}

describe('primitives generated output', () => {
  it('generates the expected primitive output artifacts', () => {
    expect(existsSync(reactStylesheetPath)).toBe(true)
    expect(existsSync(virtualFixtureSourcePath)).toBe(true)
  })

  it('emits generated utilities for inline color, mixed values, layout props, and css positioning', () => {
    const stylesheet = readFileSync(reactStylesheetPath, 'utf-8')

    expect(stylesheet).toContain('.c_\\#dc2626')
    expect(stylesheet).toContain('.bg-c_\\#fef3c7')
    expect(stylesheet).toContain('.bd-c_\\#7c3aed')
    expect(stylesheet).toContain('.d_inline-block')
    expect(stylesheet).toContain('.max-w_320px')
    expect(stylesheet).toContain('.white-space_nowrap')
    expect(stylesheet).toContain('.ov_hidden')
    expect(stylesheet).toContain('.pos_relative')
    expect(stylesheet).toContain('.top_4px')
    expect(stylesheet).toContain('.left_8px')
  })

  it('updates mirrored virtual source while keeping generated CSS stable for source-only fixture changes after ref sync', () => {
    const originalSource = readFileSync(fixtureSourcePath, 'utf-8')
    const originalVirtualSource = readFileSync(virtualFixtureSourcePath, 'utf-8')
    const originalStylesheet = readFileSync(reactStylesheetPath, 'utf-8')
    const updatedSource = originalSource
      .replace("label: 'CSS prop primitive'", "label: 'CSS prop primitive after ref sync'")
      .replace("rebuildMarker: 'stable-v1'", "rebuildMarker: 'stable-v2'")

    expect(updatedSource).not.toBe(originalSource)
    expect(originalVirtualSource).toContain("label: 'CSS prop primitive'")
    expect(originalVirtualSource).toContain("rebuildMarker: 'stable-v1'")

    try {
      writeFileSync(fixtureSourcePath, updatedSource)
      runRefSync()

      const updatedVirtualSource = readFileSync(virtualFixtureSourcePath, 'utf-8')
      const updatedStylesheet = readFileSync(reactStylesheetPath, 'utf-8')

      expect(updatedVirtualSource).toContain("label: 'CSS prop primitive after ref sync'")
      expect(updatedVirtualSource).toContain("rebuildMarker: 'stable-v2'")
      expect(updatedVirtualSource).not.toContain("label: 'CSS prop primitive'")
      expect(updatedVirtualSource).not.toContain("rebuildMarker: 'stable-v1'")
      expect(updatedStylesheet).toBe(originalStylesheet)
    } finally {
      writeFileSync(fixtureSourcePath, originalSource)
      runRefSync()
    }
  }, 120_000)
})