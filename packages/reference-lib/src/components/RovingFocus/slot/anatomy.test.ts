/** Isolated proof for slot/anatomy: the single-element gate accepts exactly
 * one element and throws the documented descriptive error for every other
 * shape — omitted, null, boolean, text, number, Fragment, and multiples —
 * naming the offending part. The render-time wiring is also covered by the
 * component SSR tests (RF-DOM-06). */

import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { assertSingleElementChild } from './anatomy'

describe('assertSingleElementChild', () => {
  it('accepts exactly one element child', () => {
    expect(() =>
      assertSingleElementChild(React.createElement('div'), 'Root')
    ).not.toThrow()
    expect(() =>
      assertSingleElementChild(React.createElement('button'), 'Item')
    ).not.toThrow()
  })

  it.each([
    { name: 'omitted', make: () => undefined, message: /received none/ },
    { name: 'null', make: () => null, message: /received none/ },
    { name: 'false', make: () => false, message: /received none/ },
    { name: 'text', make: () => 'hello', message: /received text/ },
    { name: 'number', make: () => 42, message: /received a number/ },
    {
      name: 'nonempty Fragment',
      make: () =>
        React.createElement(
          React.Fragment,
          null,
          React.createElement('div'),
          React.createElement('div')
        ),
      message: /received a Fragment/,
    },
    {
      name: 'multiple elements',
      make: () => [
        React.createElement('div', { key: 'a' }),
        React.createElement('div', { key: 'b' }),
      ],
      message: /received 2 children/,
    },
  ])('throws a descriptive error for $name children', ({ make, message }) => {
    for (const part of ['Root', 'Item'] as const) {
      expect(() => assertSingleElementChild(make() as React.ReactNode, part)).toThrow(
        new RegExp(`RovingFocus\\.${part} expects exactly one element`)
      )
      expect(() => assertSingleElementChild(make() as React.ReactNode, part)).toThrow(message)
    }
  })
})
