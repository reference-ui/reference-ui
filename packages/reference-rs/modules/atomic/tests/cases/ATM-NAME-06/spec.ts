/**
 * Digit-leading and `--`-leading class-name station. The system segment
 * leads every selector, so `2xl:p_6r` and `--brand-x` never start one;
 * no bare digit-leading or hex-escaped selector is emitted. Runtime
 * class strings stay unescaped. Bare hex escapes stay proven by the
 * escaper unit tests.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-06',
  verify(result) {
    const classes = result.css?.classes ?? {}
    expect(classes['2xl:p:6r']).toBe('digit-dash-escape__2xl:p_6r')
    const dash = Object.values(classes).find(name => name.includes('--brand-x_'))
    expect(dash).toBe('digit-dash-escape__--brand-x_red')
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    expect(utilities.has('digit-dash-escape__2xl:p_6r')).toBe(true)
    expect(utilities.has(dash as string)).toBe(true)
    expect(result.stylesheet).toContain('.digit-dash-escape__2xl\\:p_6r')
    expect(result.stylesheet).not.toContain('.2xl\\:')
    expect(result.stylesheet).not.toContain('.\\32 xl\\:')
    expect(result.stylesheet).toContain('.digit-dash-escape__--brand-x_red')
    expect(result.stylesheet).not.toContain('\\2d -')
  },
}

export default spec
