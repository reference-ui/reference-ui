/**
 * Dialect-extension realization station (ATM-EXT-01). Extension props with no
 * CSS lowering refuse at the resolve fall-through: one default-visible
 * `ATM-W-UNREALIZABLE-EXTENSION` warning naming each probed prop, zero dead
 * rules in the sheet, no plans served. Sibling platform props still extract,
 * and the lowering arms above the refusal (textGradient trio, radius-pair
 * longhands) keep working. One JSX leg proves the same funnel.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const REFUSED: Array<{ prop: string; deadDecl: string }> = [
  { prop: 'translateX', deadDecl: 'translate-x:' },
  { prop: 'boxSize', deadDecl: 'box-size:' },
  { prop: 'spaceX', deadDecl: 'space-x:' },
  { prop: 'truncate', deadDecl: 'truncate:' },
  { prop: 'hideFrom', deadDecl: 'hide-from:' },
  { prop: 'gradientFrom', deadDecl: 'gradient-from:' },
  { prop: 'textStyle', deadDecl: 'text-style:' },
  { prop: 'scrollSnapStrictness', deadDecl: 'scroll-snap-strictness:' },
  { prop: 'spaceY', deadDecl: 'space-y:' },
  { prop: 'translateY', deadDecl: 'translate-y:' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-EXT-01',
  verify(result) {
    const diags = result.diagnostics ?? []
    expect(diags).toHaveLength(REFUSED.length)
    for (const diag of diags) {
      expect(diag.code).toBe('ATM-W-UNREALIZABLE-EXTENSION')
      expect(diag.severity).toBe('warning')
      expect(diag.file).toBeTruthy()
      expect(diag.line).toBeGreaterThan(0)
    }
    for (const { prop } of REFUSED) {
      expect(
        diags.some(d => d.message.includes(prop)),
        `refusal names ${prop}`
      ).toBe(true)
    }

    // Extraction is untouched: refused props push wants, resolve drops them.
    expect(hasWant(result, 'translateX', '10px')).toBe(true)
    expect(hasWant(result, 'boxSize', '10px')).toBe(true)

    // Sibling platform props still extract, mint, and paint.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'translate', '10px')).toBe(true)
    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('translate: 10px;')

    // Lowering arms above the refusal keep working with zero refusals.
    expect(result.stylesheet).toContain('background-image: linear-gradient(red, blue);')
    expect(result.stylesheet).toContain('-webkit-background-clip: text;')
    expect(result.stylesheet).toContain('color: transparent;')
    expect(result.stylesheet).toContain('border-start-start-radius: 4px;')
    expect(result.stylesheet).toContain('border-end-start-radius: 4px;')

    // Zero dead rules: no fictional declaration, no class, no plan served.
    expect(result.stylesheet).not.toContain('text-gradient')
    for (const { deadDecl } of REFUSED) {
      expect(result.stylesheet, `no dead ${deadDecl} rule`).not.toContain(deadDecl)
    }
    const classKeys = Object.keys(result.css?.classes ?? {})
    for (const { prop } of REFUSED) {
      expect(
        classKeys.some(k => k.startsWith(`${prop}:`)),
        `no class key for ${prop}`
      ).toBe(false)
    }
    const planProps = (result.runtime?.stylePlans ?? []).map(p => p.prop)
    for (const { prop } of REFUSED) {
      expect(planProps, `no plan for ${prop}`).not.toContain(prop)
    }
  },
}

export default spec
