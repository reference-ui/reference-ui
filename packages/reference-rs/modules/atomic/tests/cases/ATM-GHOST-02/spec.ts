/**
 * Runtime class-map station. Keys are prop:value(:when) spellings and
 * values match the selectors printed in the stylesheet. Goldens are css.json.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-GHOST-02',
  verify(result) {
    const classes = result.css.classes ?? {}
    expect(classes['mt:2r']).toBe('@reference-ui/lib__mt_2r')
    expect(classes['bg:blue.600']).toBe('@reference-ui/lib__bg_blue.600')
    expect(classes['_hover:color:red.500']).toBe('@reference-ui/lib__hover:c_red.500')
  },
}

export default spec
