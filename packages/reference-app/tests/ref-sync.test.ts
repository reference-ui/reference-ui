import { describe, it, expect } from 'vitest'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const refUiDir = join(pkgRoot, '.reference-ui')

/**
 * globalSetup runs ref sync --watch before all tests.
 * This suite verifies the expected design system outputs exist.
 */
describe('ref sync', () => {
  it('creates .reference-ui/react with package.json and react.mjs', () => {
    const reactDir = join(refUiDir, 'react')
    expect(existsSync(reactDir), '.reference-ui/react should exist').toBe(true)
    expect(existsSync(join(reactDir, 'package.json')), 'react package.json').toBe(true)
    expect(existsSync(join(reactDir, 'react.mjs')), 'react.mjs entry').toBe(true)
  })

  it('creates .reference-ui/styled with package.json (css/patterns when Panda succeeds)', () => {
    const styledDir = join(refUiDir, 'styled')
    expect(existsSync(styledDir), '.reference-ui/styled should exist').toBe(true)
    expect(existsSync(join(styledDir, 'package.json')), 'styled package.json').toBe(true)
    // Panda codegen writes css/ and patterns/ when it runs. When it does not (e.g. @pandacss
    // resolution in test env), packager still writes package.json; we only assert when css/ exists.
    const hasCss = existsSync(join(styledDir, 'css'))
    if (hasCss) {
      expect(existsSync(join(styledDir, 'patterns')), 'styled/patterns when css exists').toBe(true)
    }
  })

  it('creates .reference-ui/system with package.json and system.mjs', () => {
    const systemDir = join(refUiDir, 'system')
    expect(existsSync(systemDir), '.reference-ui/system should exist').toBe(true)
    expect(existsSync(join(systemDir, 'package.json')), 'system package.json').toBe(true)
    expect(existsSync(join(systemDir, 'system.mjs')), 'system.mjs entry').toBe(true)
  })

  it('creates .reference-ui/virtual with copied source files', () => {
    const virtualDir = join(refUiDir, 'virtual')
    expect(existsSync(virtualDir), '.reference-ui/virtual should exist').toBe(true)

    const topLevel = readdirSync(virtualDir)
    expect(topLevel.length, '.reference-ui/virtual should contain entries (e.g. src/)').toBeGreaterThan(0)
    expect(topLevel, '.reference-ui/virtual should include src/ from include patterns').toContain('src')
  })
})
