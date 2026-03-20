import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { virtualDir, srcDir, testsDir, virt } from './helpers'

/**
 * Baseline: ref sync --watch runs in background (global-setup).
 * Virtual dir exists with expected structure and exclusions.
 */
describe('virtual – baseline', () => {
  it('creates .reference-ui/virtual with files matching include', () => {
    expect(existsSync(virtualDir)).toBe(true)
    expect(existsSync(virt('src', 'App.tsx'))).toBe(true)
    expect(existsSync(virt('src', 'main.tsx'))).toBe(true)
    expect(existsSync(virt('tests', 'virtual', 'baseline.test.ts'))).toBe(true)

    const srcApp = readFileSync(join(srcDir, 'App.tsx'), 'utf-8')
    const virtualApp = readFileSync(virt('src', 'App.tsx'), 'utf-8')
    expect(virtualApp).toBe(srcApp)

    const srcBaseline = readFileSync(join(testsDir, 'virtual', 'baseline.test.ts'), 'utf-8')
    const virtualBaseline = readFileSync(virt('tests', 'virtual', 'baseline.test.ts'), 'utf-8')
    expect(virtualBaseline).toBe(srcBaseline)
  })

  it('excludes node_modules and .reference-ui from virtual copy', () => {
    expect(existsSync(join(virtualDir, 'node_modules'))).toBe(false)
    expect(existsSync(join(virtualDir, '.reference-ui', 'cache'))).toBe(false)
  })

  it('does not copy files outside include patterns', () => {
    expect(existsSync(join(virtualDir, 'ui.config.ts'))).toBe(false)
    expect(existsSync(join(virtualDir, 'vite.config.ts'))).toBe(false)
  })
})
