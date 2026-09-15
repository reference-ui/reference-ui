/**
 * Unconditioned class-name station. Runtime strings stay unescaped:
 * `mt_2r`, `p_10px`, `c_blue.600`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-01',
  verify(result) {
    expect(result.css?.classes?.['mt:2r']).toBe('mt_2r')
    expect(result.css?.classes?.['p:10px']).toBe('p_10px')
    expect(result.css?.classes?.['color:blue.600']).toBe('c_blue.600')
  },
}

export default spec
