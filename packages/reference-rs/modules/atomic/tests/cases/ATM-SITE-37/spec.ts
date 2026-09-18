/**
 * Array-spread refusal station (ATM-SITE-37, Overmatch Ph1). Spreads in
 * value arrays refuse the whole array with a located diagnostic (never a
 * shifted sibling); merge-list spreads refuse while siblings still merge.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-37',
  verify(result) {
    // Only the clean array and the merge-list siblings extract. The two
    // refused value arrays yield nothing — no shifted '12px'/'4px' atoms.
    expect(hasWant(result, 'padding', '8px', ['base'])).toBe(true)
    expect(hasWant(result, 'padding', '12px', ['sm'])).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'green')).toBe(true)
    expect(hasWant(result, 'color', 'cyan')).toBe(true)
    expect(result.wants ?? []).toHaveLength(6)
    expect(hasWant(result, 'color', 'pink')).toBe(false)
    expect(hasWant(result, 'margin', '1px')).toBe(false)
    expect(hasWant(result, 'margin', '4px')).toBe(false)

    // Surviving leaves plan: the clean array plans once as an array value
    // (pre-existing responsive shape), each merge color plans once, and the
    // refused arrays plan nothing — wants and plans agree at zero there.
    expect(result.runtime.stylePlans).toHaveLength(5)

    // Four spreads, four located diagnostics, two codes.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(4)
    const responsive = diagnostics.filter(d => d.code === 'ATM-W-RESPONSIVE-ARRAY-SPREAD')
    const merge = diagnostics.filter(d => d.code === 'ATM-W-NON-OBJECT-CSS-ARG')
    expect(responsive).toHaveLength(2)
    expect(merge).toHaveLength(2)
    for (const diag of diagnostics) {
      expect(diag.severity).toBe('warning')
      expect(diag.file).toBeDefined()
      expect(diag.line).toBeDefined()
      expect(diag.column).toBeDefined()
    }
    expect(responsive.map(d => d.line).sort()).toEqual([5, 6])
    expect(merge.map(d => d.line).sort()).toEqual([5, 6])
    for (const diag of responsive) {
      expect(diag.message).toContain('refusing the array to keep breakpoint arity honest')
    }
    for (const diag of merge) {
      expect(diag.message).toContain('is not a static style object (spread element)')
    }

    expect(result.stylesheet).not.toContain('color: pink')
    expect(result.stylesheet).not.toContain('margin: 4px')
  },
}

export default spec
