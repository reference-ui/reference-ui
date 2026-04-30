import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { hasMatrixPlaywrightTests, hasMatrixVitestTests } from './test-presence.js'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-matrix-test-presence-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('matrix test presence helpers', () => {
  it('does not treat an empty e2e directory as Playwright coverage', () => {
    const root = createTempDir()
    mkdirSync(join(root, 'tests', 'e2e'), { recursive: true })

    assert.equal(hasMatrixPlaywrightTests(root), false)
  })

  it('detects nested Playwright and Vitest test files', () => {
    const root = createTempDir()
    const e2eDir = join(root, 'tests', 'e2e', 'smoke')
    const unitDir = join(root, 'tests', 'unit', 'nested')

    mkdirSync(e2eDir, { recursive: true })
    mkdirSync(unitDir, { recursive: true })
    writeFileSync(join(e2eDir, 'app.spec.ts'), 'export {}\n')
    writeFileSync(join(unitDir, 'runtime.test.ts'), 'export {}\n')

    assert.equal(hasMatrixPlaywrightTests(root), true)
    assert.equal(hasMatrixVitestTests(root), true)
  })
})