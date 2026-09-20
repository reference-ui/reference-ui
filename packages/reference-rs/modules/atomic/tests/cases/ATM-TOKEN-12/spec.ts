/**
 * Missing-reference station. A whole-value `{colors.nope}` and an embedded
 * `{colors.nope}` segment each error naming the ref with file:line, and both
 * declarations are dropped so the sheet stays valid CSS. Valid siblings
 * (`border-width`, `border-style`, the `{colors.gray.800}` control) still
 * emit. Panda's serialize path escapes the literal (`colors\.nope`); this
 * engine fails closed instead.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-12',
  verify(result) {
    expect(result.diagnostics).toHaveLength(3)
    const lines: number[] = []
    for (const diagnostic of result.diagnostics) {
      if (diagnostic.severity === 'error') {
        expect(diagnostic.message).toContain('unknown token reference')
        expect(diagnostic.message).toContain('{colors.nope}')
        expect(diagnostic.file).toMatch(/missing-ref\.tsx$/)
        expect(diagnostic.line).toBeGreaterThan(0)
        expect(diagnostic.column).toBeGreaterThan(0)
        lines.push(diagnostic.line!)
      }
    }
    expect(lines.sort()).toEqual([4, 5])
    // The fatal drops the declaration, and proof names the proven miss
    // beside it: the exact runtime lookup has no compiled style plan.
    const miss = result.diagnostics.find(
      d => d.code === 'ATM-W-MISSING-STYLE-PLAN'
    )
    expect(miss, 'proven-miss warning beside the fatal').toBeDefined()
    expect(miss!.severity).toBe('warning')
    expect(miss!.message).toContain('color')
    expect(miss!.message).toContain('{colors.nope}')
    expect(miss!.message).toContain('has no compiled style plan')
    expect(result.stylesheet).not.toContain('{colors.nope}')
    expect(result.stylesheet).not.toContain(': colors\\.nope')
    expect(result.stylesheet).not.toContain('var(--colors-nope)')
    expect(result.stylesheet).toContain('border-width: 2px;')
    expect(result.stylesheet).toContain('border-style: solid;')
    expect(result.stylesheet).toContain('outline-color: var(--colors-gray-800);')
    expect(result.atomCount).toBe(3)
    const classKeys = Object.keys(result.css?.classes ?? {})
    expect(classKeys).toHaveLength(3)
    expect(classKeys.join(' ')).not.toContain('nope')
  },
}

export default spec
