// Unit tests for the system name rule at config load. They take an upstream or own name that a
// [data-layer] selector cannot carry (a double quote, a backslash, a line break) and assert the named
// rejection, and they keep a plain name accepted. The selector is not escaped, so every name is checked.

import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../config/validate.ts'

const SYSTEM_NAME = 'my-system'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']
const FRAGMENT_CODE = 'fragment-code'
const STREAMS = [{ name: 'tokens', preamble: '@layer reset, global, base, tokens, recipes, utilities;\n' }]

describe('validateConfig names', () => {
  it('rejects an upstream name a [data-layer] selector cannot carry, and quotes it', () => {
    for (const name of ['my"system', 'my\\system', 'my\nsystem']) {
      expect(() =>
        validateConfig({
          name: SYSTEM_NAME,
          include: DEFAULT_INCLUDE,
          extends: [{ name, fragment: FRAGMENT_CODE, streams: STREAMS }],
        })
      ).toThrowError(
        /^Config field 'extends' is invalid\.\nEntry 0 \(".*"\) has a name with a double quote, a backslash or a line break/
      )
    }
  })

  it('rejects an own name with a backslash, as it already rejects a double quote', () => {
    expect(() => validateConfig({ name: 'my\\system', include: DEFAULT_INCLUDE })).toThrowError(
      /name must be safe for CSS @layer and \[data-layer\] \(no double-quotes, backslashes or newlines\)/
    )
    expect(() => validateConfig({ name: 'my"system', include: DEFAULT_INCLUDE })).toThrowError(
      /no double-quotes, backslashes or newlines/
    )
  })

  it('accepts a plain upstream name', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [{ name: 'brand-base', fragment: FRAGMENT_CODE, streams: STREAMS }],
    })

    expect(config.extends?.map((sys) => sys.name)).toEqual(['brand-base'])
  })
})
