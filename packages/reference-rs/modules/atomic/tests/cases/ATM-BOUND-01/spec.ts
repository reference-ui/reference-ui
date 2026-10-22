/**
 * Bounded-depth case. A lane-sized project with one `css()` value nested 1,000 parentheses deep must compile
 * and emit the red class. The compile itself runs in a child process (helpers.ts routes this case through
 * runIsolated), so this spec states only the contract the isolated result must meet.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-01',
  verify(result) {
    expect(result.stylesheet.length).toBeGreaterThan(0)
    expect(result.css?.classes?.['color:red']).toBe('@reference-ui/lib__c_red')
  },
}

export default spec
