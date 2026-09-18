/**
 * Array-css-prop station (ATM-SITE-19, RS-23). `<Div css={[{...}, {...}]} />`
 * extracts every element like the `css([...])` call form: one utility per
 * leaf, merged into the class set. The single-object form is the control.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-19',
  verify(result) {
    expect(hasWant(result, 'color', 'blue.300')).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'green.300')).toBe(true)
    expect(hasWant(result, 'color', 'yellow.300')).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain('color: var(--colors-blue-300);')
    expect(sheet).toContain('background-color: var(--colors-green-300);')
    expect(sheet).toContain('color: var(--colors-yellow-300);')
    expect(result.css?.classes).toEqual({
      'backgroundColor:green.300': `${SYSTEM}__bg-c_green.300`,
      'color:blue.300': `${SYSTEM}__c_blue.300`,
      'color:yellow.300': `${SYSTEM}__c_yellow.300`,
    })

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
