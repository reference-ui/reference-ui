/**
 * Whitespace-sanitize station. Spaces in authored values become `_` in
 * class names so they remain valid DOM tokens.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-05',
  verify(result) {
    const classes = Object.values(result.css?.classes ?? {})
    expect(classes.some(name => name.includes('3px_solid'))).toBe(true)
    expect(classes.some(name => name.includes('10px_20px'))).toBe(true)
    for (const name of classes) {
      expect(name).not.toMatch(/\s/)
    }
  },
}

export default spec
