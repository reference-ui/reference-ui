/**
 * Dialect-extension realization (ATM-EXT-01). Canon ships only extensions
 * that produce real CSS; the retired fictional props are unknown style
 * properties: one default-visible `ATM-W-UNKNOWN-PROPERTY` warning naming
 * each probed prop, no wants, zero dead rules in the sheet, no plans served.
 * Sibling platform props still extract, and every remaining extension paints
 * (textGradient trio, radius-pair longhands, webkitTextFillColor). One JSX leg
 * proves the same funnel.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../harness/helpers.js'

const RETIRED: Array<{ prop: string; deadDecl: string }> = [
  { prop: 'translateX', deadDecl: 'translate-x:' },
  { prop: 'boxSize', deadDecl: 'box-size:' },
  { prop: 'spaceX', deadDecl: 'space-x:' },
  { prop: 'truncate', deadDecl: 'truncate:' },
  { prop: 'hideFrom', deadDecl: 'hide-from:' },
  { prop: 'gradientFrom', deadDecl: 'gradient-from:' },
  { prop: 'textStyle', deadDecl: 'text-style:' },
  { prop: 'scrollSnapStrictness', deadDecl: 'scroll-snap-strictness:' },
  { prop: 'srOnly', deadDecl: 'sr-only:' },
  { prop: 'spaceY', deadDecl: 'space-y:' },
  { prop: 'translateY', deadDecl: 'translate-y:' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-EXT-01',
  verify(result) {
    const diags = result.diagnostics ?? []
    expect(diags).toHaveLength(RETIRED.length)
    for (const diag of diags) {
      expect(diag.code).toBe('ATM-W-UNKNOWN-PROPERTY')
      expect(diag.severity).toBe('warning')
      expect(diag.file).toBeTruthy()
      expect(diag.line).toBeGreaterThan(0)
    }
    expect(diags.some(d => d.code === 'ATM-W-UNREALIZABLE-EXTENSION')).toBe(false)
    for (const { prop } of RETIRED) {
      expect(
        diags.filter(d => d.message.includes(`"${prop}"`)),
        `exactly one unknown-property warning names ${prop}`
      ).toHaveLength(1)
    }

    // Extraction drops unknown keys, so the retired props push no wants.
    expect(hasWant(result, 'translateX', '10px')).toBe(false)
    expect(hasWant(result, 'boxSize', '10px')).toBe(false)

    // Sibling platform props still extract, mint, and paint.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'translate', '10px')).toBe(true)
    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('translate: 10px;')

    // Every remaining extension paints.
    expect(result.stylesheet).toContain('background-image: linear-gradient(red, blue);')
    expect(result.stylesheet).toContain('-webkit-background-clip: text;')
    expect(result.stylesheet).toContain('color: transparent;')
    expect(result.stylesheet).toContain('border-start-start-radius: 4px;')
    expect(result.stylesheet).toContain('border-end-start-radius: 4px;')
    expect(result.stylesheet).toContain('-webkit-text-fill-color: red;')

    // Zero dead rules: no fictional declaration, no class, no plan served.
    expect(result.stylesheet).not.toContain('text-gradient')
    for (const { deadDecl } of RETIRED) {
      expect(result.stylesheet, `no dead ${deadDecl} rule`).not.toContain(deadDecl)
    }
    const classKeys = Object.keys(result.css?.classes ?? {})
    for (const { prop } of RETIRED) {
      expect(
        classKeys.some(k => k.startsWith(`${prop}:`)),
        `no class key for ${prop}`
      ).toBe(false)
    }
    const planProps = (result.stylePlans).map(p => p.prop)
    for (const { prop } of RETIRED) {
      expect(planProps, `no plan for ${prop}`).not.toContain(prop)
    }
  },
}

export default spec
