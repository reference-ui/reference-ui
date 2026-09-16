/**
 * Important class-name station. Authored `2r!` becomes runtime
 * `<system>__mt_2r!` and a system-qualified `.mt_2r\!` selector.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-03',
  verify(result) {
    expect(result.css?.classes?.['mt:2r']).toBe('@reference-ui/lib__mt_2r!')
    expect(result.stylesheet).toContain('.\\@reference-ui\\/lib__mt_2r\\!')
  },
}

export default spec
