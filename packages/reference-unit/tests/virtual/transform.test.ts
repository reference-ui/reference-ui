import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { virt } from './helpers'

/**
 * E2E: verify virtual transforms for src/virtual/ demo files (recipes.tsx, css.tsx, demo.mdx).
 *
 * Expected behavior (see packages/reference-core/src/cli/virtual and reference-docs virtual output):
 * - css: import { css } from '@reference-ui/react' → import { css } from '../../../src/system/runtime'
 * - recipe: import { recipe } → import { cva } from '../../../src/system/runtime', recipe( → cva(
 *
 * ref sync --watch (global-setup) populates .reference-ui/virtual.
 * These tests FAIL when transforms are not applied (raw copy instead of transformed).
 */
describe('virtual – transforms (e2e)', () => {
  const virtualSrc = (...p: string[]) => virt('src', 'virtual', ...p)

  // Virtual files use fixed path; Panda (cwd=core) resolves src/system/runtime from core
  const EXPECTED_SYSTEM_CSS_IMPORT = "from 'src/system/runtime'"

  it('rewrites css import to styled-system path (src/virtual/css.tsx)', () => {
    expect(existsSync(virtualSrc('css.tsx'))).toBe(true)
    const c = readFileSync(virtualSrc('css.tsx'), 'utf-8')

    // Transformed: css must be imported from system/runtime (see reference-docs CssDemo.tsx)
    expect(c).toContain(EXPECTED_SYSTEM_CSS_IMPORT)
    expect(c).not.toContain("from '@reference-ui/react'")
  })

  it('rewrites recipe imports to cva from styled-system path (src/virtual/recipes.tsx)', () => {
    expect(existsSync(virtualSrc('recipes.tsx'))).toBe(true)
    const c = readFileSync(virtualSrc('recipes.tsx'), 'utf-8')

    // Transformed: cva from system/runtime, recipe( → cva( (see reference-docs RecipeDemo.tsx)
    expect(c).toContain(EXPECTED_SYSTEM_CSS_IMPORT)
    expect(c).toMatch(/import\s*\{\s*cva\s*\}\s*from/)
    expect(c).toContain('cva(')
    expect(c).not.toContain('recipe(')
    expect(c).not.toMatch(/import\s*\{\s*recipe\s*\}\s*from/)
  })

  it('transforms MDX to JSX (src/virtual/demo.mdx → demo.jsx in virtual)', () => {
    expect(existsSync(virtualSrc('demo.jsx'))).toBe(true)
    const c = readFileSync(virtualSrc('demo.jsx'), 'utf-8')
    expect(c).toContain('Hello from MDX')
    expect(c).toMatch(/function|=>|<_components|MDXContent/)
  })
})
