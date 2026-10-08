/**
 * @media preset conditions must print as at-rules, not selectors.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-11',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('@media (prefers-color-scheme: dark)')
    expect(sheet).toContain('@media (prefers-reduced-motion: reduce)')
    expect(sheet).toContain('@media print')
    expect(sheet).toContain('.\\@reference-ui\\/lib__osDark\\:c_blue\\.600')
    expect(sheet).toContain('.\\@reference-ui\\/lib__motionReduce\\:anim_none')
    expect(sheet).toContain('.\\@reference-ui\\/lib__print\\:d_none')
  },
}

export default spec
