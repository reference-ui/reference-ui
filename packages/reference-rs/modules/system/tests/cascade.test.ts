/**
 * Verification test suite for CSS cascade layer ordering, shorthand decomposition, and rhythm/token resolution.
 * Asserts that compiled stylesheets emit all canonical `@layer` declarations in strict precedence order.
 * Verifies that composite shorthands never emit default currentColor values, preserving independent color tokens.
 */
import { describe, expect, it } from 'vitest'
import { compileVirtual, compileVirtualSync } from './helpers.js'

describe('system cascade and stylesheet emission', () => {
  it('emits all 6 layers in canonical order for baseline empty input', async () => {
    const result = await compileVirtual([])
    expect(result.stylesheet).toBe(
      '@layer reset, global, base, tokens, recipes, utilities;\n'
    )
  })

  it('preserves empty diagnostics on valid input', async () => {
    const result = await compileVirtual({
      'src/Button.tsx': 'export const Button = () => null',
    })
    expect(result.diagnostics).toEqual([])
  })

  describe('composite shorthand decomposition and cascade safety', () => {
    it('decomposes borderBottom without emitting currentColor, preserving borderColor', () => {
      const code = `
        export const Tabs = () => (
          <Div
            borderBottom="3px solid"
            borderColor="gray.800"
          />
        )
      `
      const result = compileVirtualSync({ 'src/Tabs.tsx': code })
      expect(result.stylesheet).toContain('@layer utilities {')
      expect(result.stylesheet).toContain('border-bottom-width: 3px;')
      expect(result.stylesheet).toContain('border-bottom-style: solid;')
      expect(result.stylesheet).toContain('border-color: var(--colors-gray-800);')
      // Critical invariant: currentColor must NOT be synthesized or emitted
      expect(result.stylesheet.toLowerCase()).not.toContain('currentcolor')
    })

    it('decomposes outline without clobbering outlineColor', () => {
      const code = `
        export const Button = () => (
          <Div
            outline="1px solid"
            outlineColor="blue.600"
          />
        )
      `
      const result = compileVirtualSync({ 'src/Button.tsx': code })
      expect(result.stylesheet).toContain('outline-width: 1px;')
      expect(result.stylesheet).toContain('outline-style: solid;')
      expect(result.stylesheet).toContain('outline-color: var(--colors-blue-600);')
      expect(result.stylesheet.toLowerCase()).not.toContain('currentcolor')
    })
  })

  describe('rhythm unit resolution', () => {
    it('resolves integer, multiplier, and fractional rhythm units to exact CSS formulas', () => {
      const code = `
        export const SpacingDemo = () => (
          <Div
            mt="1r"
            mb="2r"
            pt="0.5r"
            pb="1/3r"
          />
        )
      `
      const result = compileVirtualSync({ 'src/SpacingDemo.tsx': code })
      expect(result.stylesheet).toContain('margin-top: var(--spacing-root);')
      expect(result.stylesheet).toContain('margin-bottom: calc(2 * var(--spacing-root));')
      expect(result.stylesheet).toContain('padding-top: calc(0.5 * var(--spacing-root));')
      expect(result.stylesheet).toContain('padding-bottom: calc(var(--spacing-root) / 3);')
    })
  })

  describe('responsive and pseudo condition scoping', () => {
    it('wraps breakpoint array items in media queries and pseudo conditions in selector matches', () => {
      const code = `
        export const ResponsiveCard = () => (
          <Div
            mt={["1r", "2r"]}
            _hover={{ bg: "blue.600" }}
          />
        )
      `
      const result = compileVirtualSync({ 'src/ResponsiveCard.tsx': code })
      // Base array item is unconditioned
      expect(result.stylesheet).toContain('.mt_1r { margin-top: var(--spacing-root); }')
      // Breakpoint item is wrapped in media query
      expect(result.stylesheet).toContain('@media screen and (min-width: 40rem)')
      expect(result.stylesheet).toContain('.sm\\:mt_2r { margin-top: calc(2 * var(--spacing-root)); }')
      // Pseudo hover selector is lowered
      expect(result.stylesheet).toContain('.hover\\:bg_blue\\.600:is(:hover, [data-hover])')
      expect(result.stylesheet).toContain('background: var(--colors-blue-600);')
    })
  })
})
