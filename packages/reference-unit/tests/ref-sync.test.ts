import { describe, it, expect } from 'vitest'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const refUiDir = join(pkgRoot, '.reference-ui')

/**
 * globalSetup runs ref sync --watch before all tests.
 * This suite verifies the expected design system outputs exist.
 */
describe('ref sync', () => {
  // MIGRATED: Covered by matrix/distro/tests/unit/generated-output.test.ts and
  // matrix/distro/tests/unit/distro.test.tsx.
  it.skip('creates .reference-ui/react with package.json and react.mjs', () => {
    const reactDir = join(refUiDir, 'react')
    expect(existsSync(reactDir), '.reference-ui/react should exist').toBe(true)
    expect(existsSync(join(reactDir, 'package.json')), 'react package.json').toBe(true)
    expect(existsSync(join(reactDir, 'react.mjs')), 'react.mjs entry').toBe(true)
  })

  // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
  it.skip('creates .reference-ui/styled with package.json (css/patterns when Panda succeeds)', () => {
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

  // TODO(reference-unit/layers): Matrix distro now locks the generic styled
  // layer prelude, but this reference-unit case still uniquely covers the
  // layer-library composition specific to the extends x layers fixture setup.
  it('keeps runtime styles.css in layered form when reference-unit includes layers', () => {
    const stylesPath = join(refUiDir, 'styled', 'styles.css')
    if (!existsSync(stylesPath)) return
    const css = readFileSync(stylesPath, 'utf-8')
    expect(css).toMatch(/@layer\s+reference-unit\s*\{/)
    expect(css).toMatch(/data-layer.*layer-library/)
    expect(css).toMatch(/^@layer\s+[^;\n]+;/)
  })

  // MIGRATED: Covered by matrix/distro/tests/unit/generated-output.test.ts and
  // matrix/distro/tests/unit/distro.test.tsx.
  it.skip('creates .reference-ui/system with package.json and system.mjs', () => {
    const systemDir = join(refUiDir, 'system')
    expect(existsSync(systemDir), '.reference-ui/system should exist').toBe(true)
    expect(existsSync(join(systemDir, 'package.json')), 'system package.json').toBe(true)
    expect(existsSync(join(systemDir, 'system.mjs')), 'system.mjs entry').toBe(true)
    expect(existsSync(join(systemDir, 'baseSystem.mjs')), 'system/baseSystem.mjs entry').toBe(true)
  })

  // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
  it.skip('emits baseSystem.mjs with portable css for layers consumers', () => {
    const basePath = join(refUiDir, 'system', 'baseSystem.mjs')
    if (!existsSync(basePath)) return
    const content = readFileSync(basePath, 'utf-8')
    expect(content).toMatch(/"css":\s*"/)
    expect(content).toMatch(/@layer\s+reference-unit/)
    // In JSON the css string has escaped quotes: [data-layer=\"reference-unit\"]
    expect(content).toMatch(/data-layer.*reference-unit/)
    expect(content).toMatch(/"jsxElements":\s*\[[^\]]*"UnitMarker"/)
  })

  // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
  it.skip('writes resolved jsx-elements metadata for configured custom JSX components', () => {
    const jsxElementsPath = join(refUiDir, 'system', 'jsx-elements.json')
    if (!existsSync(jsxElementsPath)) return
    const content = readFileSync(jsxElementsPath, 'utf-8')
    expect(content).toMatch(/"local":\s*\[[^\]]*"UnitMarker"/)
    expect(content).toMatch(/"merged":\s*\[[\s\S]*"UnitMarker"/)
  })

  // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
  it.skip('creates .reference-ui/virtual with copied source files', () => {
    const virtualDir = join(refUiDir, 'virtual')
    expect(existsSync(virtualDir), '.reference-ui/virtual should exist').toBe(true)

    const topLevel = readdirSync(virtualDir)
    expect(topLevel.length, '.reference-ui/virtual should contain entries (e.g. src/)').toBeGreaterThan(0)
    expect(topLevel, '.reference-ui/virtual should include src/ from include patterns').toContain('src')
  })
})
