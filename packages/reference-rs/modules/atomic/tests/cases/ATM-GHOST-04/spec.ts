/**
 * Unknown `_nope` collision station. The unrecognised condition must not
 * wrap `:nope` onto the sibling `c_red` class. The standing injectivity
 * gauge stays blocked on ATM-LEAF-05 (`p` / `padding`).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-GHOST-04',
  verify(result) {
    expect(hasWant(result, 'color', 'red', ['_nope'])).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(result.stylesheet).toContain('.c_red { color: red; }')
    expect(result.stylesheet).not.toContain(':nope')
    expect(result.stylesheet).not.toContain('nope:')
    expect(result.css.classes?.['color:red']).toBe('c_red')
    expect(result.css.classes?.['_nope:color:red']).toBeUndefined()
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]?.message).toContain('_nope')
    expect(result.atomCount).toBe(1)
  },
}

export default spec
