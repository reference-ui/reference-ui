/**
 * One-grain station. Every `@layer utilities` rule contains a single
 * CSS declaration. No hashed whole-object classes.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ATOM-04',
  verify(result) {
    const classes = Object.values(result.css?.classes ?? {})
    expect(classes.length).toBeGreaterThanOrEqual(3)
    const utilities = layerBody(result.stylesheet, 'utilities')
    const rules = [...utilities.matchAll(/\{ ([^}]+) \}/g)].map(m => m[1]!.trim())
    expect(rules.length).toBeGreaterThanOrEqual(1)
    for (const decl of rules) {
      const props = decl
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
      expect(props).toHaveLength(1)
    }
    expect(result.stylesheet).not.toMatch(/\.css-[a-z0-9]{5,}/)
  },
}

export default spec
