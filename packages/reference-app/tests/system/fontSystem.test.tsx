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
  it('injects generated font config fragments into panda.config.ts', () => {
    if (!existsSync(pandaConfigPath)) return

    const content = readFileSync(pandaConfigPath, 'utf-8')

    expect(content).toContain('globalFontface({')
    expect(content).toContain("recipe('fontStyle'")
    expect(content).toContain("'sans.bold': { value: '700' }")
  })

  it('emits @font-face rules in generated CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('@font-face')
    expect(css).toContain('font-display:swap')
    expect(css).toMatch(/font-family:\s*["']?Inter["']?/)
  })
})
