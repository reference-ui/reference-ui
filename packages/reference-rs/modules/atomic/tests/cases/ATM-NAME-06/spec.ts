/**
 * Digit-leading and `--`-leading class-name station. `2xl:p_6r` emits
 * `.\32 xl\:p_6r` (hex escape plus terminating space). `--brand-x` escapes
 * the first dash. Runtime class strings stay unescaped.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-06',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(classes['2xl:p:6r']).toBe('2xl:p_6r')
    const dash = Object.values(classes).find(name => name.startsWith('--'))
    expect(dash).toBeTruthy()
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities.has('2xl:p_6r')).toBe(true)
    expect(utilities.has(dash as string)).toBe(true)
    expect(result.stylesheet).toContain('.\\32 xl\\:p_6r')
    expect(result.stylesheet).not.toContain('.2xl\\:')
    expect(result.stylesheet).toContain('\\2d -')
  },
}

export default spec
