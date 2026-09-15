/**
 * Hash-class tripwire. Compile output never contains `.css-<hash>` names.
 * Every runtime class is an atomic `prefix_value` grain.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-FORBID-01',
  verify(result) {
    expect(result.stylesheet).not.toMatch(/\.css-[a-zA-Z0-9]{5,}/)
    const classes = Object.values(result.css?.classes ?? {})
    expect(classes.length).toBeGreaterThanOrEqual(2)
    for (const name of classes) {
      expect(name).not.toMatch(/^css-[a-zA-Z0-9]+$/)
      expect(name).toContain('_')
    }
  },
}

export default spec
