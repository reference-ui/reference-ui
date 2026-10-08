/**
 * Bound-root member station (ATM-SITE-88). `<NS.Panel />` extracts when its
 * root resolves through a same-file const object literal to an admitted host
 * and `NSPanel` is a host; the unconfigured `<Other.Panel />` twin stays
 * silent; the use-before-declare `<Late.Panel />` pair extracts the same.
 * Zero diagnostics either way.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-88',
  verify(result) {
    expect(hasWant(result, 'minW', '40r')).toBe(true)
    expect(hasWant(result, 'bg', 'red')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'p', '4r')).toBe(false)

    expect(result.css?.classes?.['minW:40r']).toBe(`${SYSTEM}__min-w_40r`)
    expect(result.css?.classes?.['bg:red']).toBe(`${SYSTEM}__bg_red`)
    expect(result.css?.classes?.['mt:2r']).toBe(`${SYSTEM}__mt_2r`)
    expect(result.css?.classes?.['p:4r']).toBeUndefined()

    const sheet = result.stylesheet
    expect(sheet).toContain('min-width: calc(40 * var(--spacing-root));')
    expect(sheet).toContain('background: red;')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
