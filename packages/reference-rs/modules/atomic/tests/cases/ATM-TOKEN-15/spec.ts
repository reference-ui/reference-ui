/**
 * Radius-longhand station (§10). Every corner longhand resolves bare
 * values against `radii` like `borderRadius` does, and the four side pairs
 * expand to their corners before lookup. No mismatch, no passthrough.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const CORNERS = [
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-start-start-radius',
  'border-start-end-radius',
  'border-end-start-radius',
  'border-end-end-radius',
]

const PHYSICAL = CORNERS.slice(0, 4)

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-15',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('border-radius: var(--radii-full);')
    for (const corner of CORNERS) {
      expect(sheet).toContain(`${corner}: var(--radii-full);`)
    }
    // The side pairs resolve `md` through the same category, then expand.
    for (const corner of PHYSICAL) {
      expect(sheet).toContain(`${corner}: var(--radii-md);`)
    }
    expect(sheet.split('var(--radii-full)').length - 1).toBe(9)
    expect(sheet.split('var(--radii-md)').length - 1).toBe(4)
    expect(sheet).not.toContain(': full;')
    expect(sheet).not.toContain(': md;')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
