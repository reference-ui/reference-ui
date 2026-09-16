/**
 * Strict recipe identity and refusal station.
 * Validates compiler rejection of missing className, dynamic arguments,
 * and duplicate recipe className in the same system with descriptive error diagnostics.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-06',
  verify(result) {
    const errorMessages = result.diagnostics.map(d => d.message)

    // Missing className
    expect(
      errorMessages.some(m =>
        m.includes("requires an explicit string-literal 'className' property")
      )
    ).toBe(true)

    // Non-object literal argument
    expect(
      errorMessages.some(m => m.includes('inline object literal'))
    ).toBe(true)

    // Duplicate className
    expect(
      errorMessages.some(m =>
        m.includes("Duplicate recipe className 'duplicateBadge' within system '@reference-ui/lib'")
      )
    ).toBe(true)

    // Exactly one valid recipe made it to the table
    const tables = result.recipes ?? []
    expect(tables).toHaveLength(1)
    expect(tables[0]?.className).toBe('duplicateBadge')
  },
}

export default spec
