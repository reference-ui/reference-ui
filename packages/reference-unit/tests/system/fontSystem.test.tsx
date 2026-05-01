/**
 * @vitest-environment happy-dom
 *
 * Verifies the font subsystem contributes config fragments and runtime CSS.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDesignSystemCss, injectDesignSystemCss } from '../primitives/setup'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(__dirname, '..', '..')
const pandaConfigPath = join(pkgRoot, '.reference-ui', 'panda.config.ts')

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip CSS assertions.
  }
})

describe('font subsystem', () => {
  // TODO(matrix/font): Matrix font tests cover generated font types and mounted
  // stylesheet behavior, but they do not inspect panda.config.ts helper wiring.
  it('injects generated font config fragments into panda.config.ts', () => {
    if (!existsSync(pandaConfigPath)) return

    const content = readFileSync(pandaConfigPath, 'utf-8')

    expect(content).toContain('const fontDefinitions =')
    expect(content).toContain('buildFontFaces(fontDefinitions)')
    expect(content).toContain('buildFontRecipes(fontDefinitions)')
    expect(content).toContain('buildFontPatternExtensions(fontDefinitions)')
  })

  // MIGRATED: Covered by matrix/font/tests/unit/runtime.test.ts
  // and matrix/font/tests/e2e/font-contract.spec.ts.
  it.skip('emits @font-face rules in generated CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('@font-face')
    expect(css).toMatch(/font-display:\s*swap/)
    expect(css).toMatch(/font-family:\s*["']?Inter["']?/)
  })
})
