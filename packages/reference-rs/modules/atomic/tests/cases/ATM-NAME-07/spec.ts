/**
 * Allowlist-escape station. Characters outside `[A-Za-z0-9_-]`, including `*`
 * from `'& > *'`, are escaped in selectors. Runtime class strings stay
 * unescaped. Every emitted selector must parse (CSS gauge).
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const MARKERS = ['*', '$', '^', '|', '\\', ';', '?', '<', '`', 'é'] as const

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-07',
  verify(result) {
    const classes = Object.values(result.css?.classes ?? {})
    for (const marker of MARKERS) {
      expect(
        classes.some(name => name.includes(marker)),
        `runtime class should contain ${JSON.stringify(marker)}`
      ).toBe(true)
    }
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const name of classes) {
      expect(utilities.has(name)).toBe(true)
    }
    expect(result.stylesheet).toContain('\\*')
    expect(result.stylesheet).toContain(' > *')
  },
}

export default spec
