/**
 * Unknown bare names on token-backed length props (spacing, radii, sizes,
 * font sizes). Each unknown name passes through raw and warns exactly once,
 * with the category noun its prop draws on. The baseSystem declares real
 * tokens in every category, so each miss is a miss by name.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-24',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('padding: upGap;')
    expect(sheet).toContain('border-radius: upRadius;')
    expect(sheet).toContain('font-size: upSize;')
    expect(sheet).toContain('width: upSize;')
    expect(result.diagnostics).toHaveLength(4)
    const warnings = result.diagnostics.filter(d => d.code === 'ATM-W-UNKNOWN-TOKEN')
    expect(warnings.every(d => d.severity === 'warning')).toBe(true)
    expect(warnings.map(d => d.message).sort()).toEqual(
      [
        '`upGap` is not a spacing token',
        '`upRadius` is not a radius token',
        '`upSize` is not a font-size token',
        '`upSize` is not a size token',
      ].sort()
    )
  },
}

export default spec
