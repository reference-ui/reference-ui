/**
 * Important class-name station. Authored `2r!` becomes runtime `mt_2r!`
 * and stylesheet `.mt_2r\!`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-03',
  verify(result) {
    expect(result.css?.classes?.['mt:2r']).toBe('mt_2r!')
    expect(result.stylesheet).toContain('.mt_2r\\!')
  },
}

export default spec
