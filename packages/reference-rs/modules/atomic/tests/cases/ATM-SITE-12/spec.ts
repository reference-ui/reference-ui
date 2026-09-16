/**
 * Tagged-template refusal station. css`…` produces no wants and no
 * diagnostics, while the neighbouring object call still extracts.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-12',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.wants ?? []).toHaveLength(1)
    expect(result.diagnostics).toEqual([])
    expect(result.stylesheet).not.toContain('color: red;')
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(1)
  },
}

export default spec
