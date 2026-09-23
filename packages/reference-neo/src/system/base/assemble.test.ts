// Unit tests for the published-system assembly root.
// They take narrow assembly inputs and assert the mapped BaseSystem shape.
// The round-trip leg pins the extends chain's founding invariant: assembly
// output always satisfies the entries validator.

import { describe, expect, it } from 'vitest'
import { assembleBaseSystem } from './assemble.ts'
import { validateBaseSystemEntries } from './validate.ts'

describe('assembleBaseSystem', () => {
  it('maps the narrow input onto the published shape', () => {
    expect(
      assembleBaseSystem({
        name: 'app-system',
        fragment: ';tokens()',
        css: '@layer app;',
        jsxElements: ['Card', 'Panel'],
      })
    ).toEqual({
      name: 'app-system',
      fragment: ';tokens()',
      css: '@layer app;',
      jsxElements: ['Card', 'Panel'],
    })
  })

  it('leaves css undefined when the input carries none', () => {
    const assembled = assembleBaseSystem({
      name: 'app-system',
      fragment: ';tokens()',
      jsxElements: [],
    })

    expect(assembled.css).toBeUndefined()
    expect(assembled.name).toBe('app-system')
  })

  it('passes the extends entries validator', () => {
    const assembled = assembleBaseSystem({
      name: 'app-system',
      fragment: ';tokens()',
      css: '@layer app;',
      jsxElements: ['Card'],
    })

    expect(() =>
      validateBaseSystemEntries('extends', [assembled], { requireFragment: true })
    ).not.toThrow()
  })
})
