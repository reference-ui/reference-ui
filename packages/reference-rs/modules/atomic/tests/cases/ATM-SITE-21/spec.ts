/**
 * JSX ternary-object station (ATM-SITE-21, RS-34). Ternary arms holding
 * style objects in `_hover`/`css` props compile every leaf of every arm;
 * the `undefined` arm stays silent with zero diagnostics.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'
const HOVER: string[] = ['_hover']

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-21',
  verify(result) {
    // Simple conditional ternary: both arms land under _hover.
    expect(hasWant(result, 'backgroundColor', 'red', HOVER)).toBe(true)
    expect(hasWant(result, 'backgroundColor', 'blue', HOVER)).toBe(true)

    // Nested Tabs shape: all four leaves across both inner arms.
    expect(hasWant(result, 'color', 'green', HOVER)).toBe(true)
    expect(hasWant(result, 'borderColor', 'black', HOVER)).toBe(true)
    expect(hasWant(result, 'color', 'white', HOVER)).toBe(true)
    expect(hasWant(result, 'bg', 'gray', HOVER)).toBe(true)

    // css-prop control: both arms, no condition.
    expect(hasWant(result, 'color', 'yellow')).toBe(true)
    expect(hasWant(result, 'color', 'purple')).toBe(true)

    // Closed classes resolve for every arm, hover and plain.
    expect(result.css?.classes?.['_hover:backgroundColor:red']).toBe(`${SYSTEM}__hover:bg-c_red`)
    expect(result.css?.classes?.['_hover:backgroundColor:blue']).toBe(`${SYSTEM}__hover:bg-c_blue`)
    expect(result.css?.classes?.['_hover:color:green']).toBe(`${SYSTEM}__hover:c_green`)
    expect(result.css?.classes?.['_hover:borderColor:black']).toBe(`${SYSTEM}__hover:bd-c_black`)
    expect(result.css?.classes?.['_hover:color:white']).toBe(`${SYSTEM}__hover:c_white`)
    expect(result.css?.classes?.['_hover:bg:gray']).toBe(`${SYSTEM}__hover:bg_gray`)
    expect(result.css?.classes?.['color:yellow']).toBe(`${SYSTEM}__c_yellow`)
    expect(result.css?.classes?.['color:purple']).toBe(`${SYSTEM}__c_purple`)

    const sheet = result.stylesheet
    expect(sheet).toContain('background-color: red;')
    expect(sheet).toContain('border-color: black;')
    expect(sheet).toContain(':is(:hover, [data-hover])')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
