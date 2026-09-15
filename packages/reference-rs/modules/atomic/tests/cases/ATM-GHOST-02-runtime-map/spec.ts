/**
 * Runtime class-map station. Keys are prop:value(:when) spellings and
 * values match the selectors printed in the stylesheet. Goldens are css.json.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-GHOST-02',
  ids: ['ATM-GHOST-02', 'ATM-NAME-01'],
  verify(result) {
    const classes = result.css.classes ?? {}
    expect(classes['mt:2r']).toBe('mt_2r')
    expect(classes['bg:blue.600']).toBe('bg_blue.600')
    expect(classes['_hover:color:red.500']).toBe('hover:c_red.500')
    expect(result.stylesheet).toContain('.mt_2r {')
    expect(result.stylesheet).toContain('.bg_blue\\.600 {')
    expect(result.stylesheet).toContain('.hover\\:c_red\\.500:is(:hover, [data-hover]) {')
  },
}

export default spec
