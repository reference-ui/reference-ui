/**
 * Unconditioned class-name station. Runtime strings stay unescaped:
 * `<system>__mt_2r`, `<system>__p_10px`, `<system>__c_blue.600`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-01',
  verify(result) {
    expect(result.css?.classes?.['mt:2r']).toBe('@reference-ui/lib__mt_2r')
    expect(result.css?.classes?.['p:10px']).toBe('@reference-ui/lib__p_10px')
    expect(result.css?.classes?.['color:blue.600']).toBe('@reference-ui/lib__c_blue.600')
  },
}

export default spec
