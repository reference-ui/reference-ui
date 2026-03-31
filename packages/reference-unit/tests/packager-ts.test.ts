import { describe, it, expect, beforeAll } from 'vitest'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const refUiDir = join(pkgRoot, '.reference-ui')

/** Poll until type outputs exist or timeout. Only this suite waits on packager-ts. */
async function waitForTypeOutputs(maxMs = 45_000): Promise<void> {
  const reactDts = join(refUiDir, 'react', 'react.d.mts')
  const systemDts = join(refUiDir, 'system', 'system.d.mts')
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (existsSync(reactDts) && existsSync(systemDts)) {
      await new Promise(r => setTimeout(r, 50))
      return
    }
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error(
    `packager-ts did not produce react.d.mts and system.d.mts within ${maxMs}ms`
  )
}

/**
 * TypeScript generator (packager-ts) test suite.
 * This suite waits for type outputs before running; other tests do not block on packager-ts.
 */
describe('packager-ts (TypeScript generator)', () => {
  beforeAll(async () => {
    await waitForTypeOutputs()
  })
  describe('declaration outputs', () => {
    it('emits .reference-ui/react/react.d.mts', () => {
      const path = join(refUiDir, 'react', 'react.d.mts')
      expect(existsSync(path), `${path} should exist`).toBe(true)
    })

    it('emits .reference-ui/system/system.d.mts', () => {
      const path = join(refUiDir, 'system', 'system.d.mts')
      expect(existsSync(path), `${path} should exist`).toBe(true)
    })
  })

  describe('package.json types field', () => {
    it('react package.json has types pointing to react.d.mts', () => {
      const pkgPath = join(refUiDir, 'react', 'package.json')
      expect(existsSync(pkgPath), 'react package.json').toBe(true)
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      expect(pkg.types).toBe('./react.d.mts')
    })

    it('system package.json has types pointing to system.d.mts', () => {
      const pkgPath = join(refUiDir, 'system', 'package.json')
      expect(existsSync(pkgPath), 'system package.json').toBe(true)
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      expect(pkg.types).toBe('./system.d.mts')
    })
  })

  describe('react declaration content', () => {
    it('react.d.mts declares expected component exports (Div, Button, recipe)', () => {
      const path = join(refUiDir, 'react', 'react.d.mts')
      if (!existsSync(path)) {
        // Skip content check if types were skipped (e.g. skipTypescript in config)
        return
      }
      const content = readFileSync(path, 'utf-8')
      expect(content, 'Div').toMatch(/\bDiv\b/)
      expect(content, 'Button').toMatch(/\bButton\b/)
      expect(content, 'recipe').toMatch(/\brecipe\b/)
    })
  })
})
