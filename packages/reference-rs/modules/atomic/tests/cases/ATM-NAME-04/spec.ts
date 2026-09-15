/**
 * Selector-escape station. Slash, dot, colon, and bracket characters are
 * escaped in CSS selectors while runtime class strings stay clean.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-04',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(classes['p:1/2r']).toBe('p_1/2r')
    expect(classes['color:blue.600']).toBe('c_blue.600')
    expect(classes['_hover:mt:2r']).toBe('hover:mt_2r')
    const slash = classes['p:1/2r'] as string
    const token = classes['color:blue.600'] as string
    const hover = classes['_hover:mt:2r'] as string
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities.has(slash)).toBe(true)
    expect(utilities.has(token)).toBe(true)
    expect(utilities.has(hover)).toBe(true)
    expect(result.stylesheet).toContain('.p_1\\/2r')
    expect(result.stylesheet).toContain('.c_blue\\.600')
    expect(result.stylesheet).toContain('.hover\\:mt_2r')
    const bracket = Object.values(classes).find(name => name.includes('['))
    expect(bracket).toBeTruthy()
    expect(utilities.has(bracket as string)).toBe(true)
  },
}

export default spec
