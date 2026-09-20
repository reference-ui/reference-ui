/**
 * Array-spread station (ATM-SITE-37, Overmatch Ph1 refuse + Ph3 flatten).
 * Literal and const-array spreads flatten in place — value arrays keep
 * breakpoint arity slot-for-slot, merge lists merge element-wise — while
 * dynamic, object-carrying, and reassigned spreads refuse with a located
 * diagnostic, siblings kept and arity honest.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-37',
  async verify(result) {
    // Flattened value arrays land every slot at its own breakpoint.
    expect(hasWant(result, 'margin', '1px', ['base'])).toBe(true)
    expect(hasWant(result, 'margin', '2px', ['sm'])).toBe(true)
    expect(hasWant(result, 'margin', '3px', ['md'])).toBe(true)
    expect(hasWant(result, 'margin', '4px', ['lg'])).toBe(true)
    expect(hasWant(result, 'margin', '10px', ['base'])).toBe(true)
    expect(hasWant(result, 'margin', '20px', ['sm'])).toBe(true)
    expect(hasWant(result, 'margin', '30px', ['md'])).toBe(true)
    expect(hasWant(result, 'margin', '40px', ['lg'])).toBe(true)
    expect(hasWant(result, 'padding', '8px', ['base'])).toBe(true)
    expect(hasWant(result, 'padding', '12px', ['sm'])).toBe(true)
    // Refused value arrays yield nothing — no shifted siblings, no stale leaves.
    expect(hasWant(result, 'margin', '5px')).toBe(false)
    expect(hasWant(result, 'margin', '6px')).toBe(false)

    // Merge lists merge flattened elements beside their siblings.
    for (const color of [
      'red',
      'blue',
      'green',
      'pink',
      'cyan',
      'teal',
      'orange',
      'purple',
      'navy',
      'olive',
      'lime',
      'maroon',
    ]) {
      expect(hasWant(result, 'color', color)).toBe(true)
    }
    expect(hasWant(result, 'color', 'black')).toBe(false)
    expect(result.wants ?? []).toHaveLength(22)

    // Each flattened array plans once as an array value; each merge color
    // plans once; refused arrays plan nothing — wants and plans agree.
    const plans = result.runtime.stylePlans ?? []
    expect(plans).toHaveLength(15)
    expect(
      plans.some(p => p.prop === 'margin' && JSON.stringify(p.value) === '["1px","2px","3px","4px"]'),
    ).toBe(true)
    expect(
      plans.some(
        p => p.prop === 'margin' && JSON.stringify(p.value) === '["10px","20px","30px","40px"]',
      ),
    ).toBe(true)

    // Five spreads, five located diagnostics, three codes — on the
    // opt-in channel now (S6 E8-class re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-37', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const diagnostics = (opted.compilerDiagnostics ?? []).filter(
      d => d.severity === 'warning'
    )
    expect(diagnostics).toHaveLength(5)
    const responsive = diagnostics.filter(d => d.code === 'ATM-W-RESPONSIVE-ARRAY-SPREAD')
    const merge = diagnostics.filter(d => d.code === 'ATM-W-NON-OBJECT-CSS-ARG')
    const mutated = diagnostics.filter(d => d.code === 'ATM-W-MUTATED-BINDING')
    expect(responsive).toHaveLength(2)
    expect(merge).toHaveLength(1)
    expect(mutated).toHaveLength(2)
    for (const diag of diagnostics) {
      expect(diag.severity).toBe('warning')
      expect(diag.file).toBeDefined()
      expect(diag.line).toBeDefined()
      expect(diag.column).toBeDefined()
    }
    expect(responsive.map(d => d.line).sort()).toEqual([10, 13])
    expect(responsive.every(d => d.file?.match(/arrays\.ts$/))).toBe(true)
    for (const diag of responsive) {
      expect(diag.message).toContain('refusing the array to keep breakpoint arity honest')
    }
    expect(merge[0]!.line).toBe(10)
    expect(merge[0]!.file).toMatch(/merge\.ts$/)
    expect(merge[0]!.message).toContain('is not a static style object (spread element)')
    expect(mutated.map(d => d.line).sort()).toEqual([14, 14])
    for (const diag of mutated) {
      expect(diag.message).toMatch(/Dynamic mutated binding/)
      expect(diag.message).toContain('reassigned at')
    }

    expect(result.stylesheet).not.toContain('margin: 5px')
    expect(result.stylesheet).not.toContain('margin: 6px')
    expect(result.stylesheet).not.toContain('color: black')
  },
}

export default spec
