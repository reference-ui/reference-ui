// Unit tests for the Neo primitive prop splitter.
// They take props plus a baked name list and assert the style/DOM split.
// Reserved keys stay out of both buckets; unknowns always reach the DOM
// except condition arms, which ride to style resolution as whens.

import { describe, expect, it } from 'vitest'
import { createPropSplitter } from './split.ts'

const split = createPropSplitter(['color', 'p', 'backgroundColor'])

describe('splitPrimitiveProps', () => {
  it('routes known style props to resolution and the rest to the DOM', () => {
    const result = split({ color: 'brand', p: 'sm', id: 'prim', title: 'hi' })
    expect(result.styleProps).toEqual({ color: 'brand', p: 'sm' })
    expect(result.elementProps).toEqual({ id: 'prim', title: 'hi' })
  })

  it('pulls reserved keys out of both buckets', () => {
    const result = split({
      className: 'extra',
      children: 'prim',
      colorMode: 'dark',
      variant: 'solid',
      css: { color: 'ink' },
      ref: { current: null },
      color: 'brand',
    })
    expect(result.className).toBe('extra')
    expect(result.children).toBe('prim')
    expect(result.colorMode).toBe('dark')
    expect(result.variant).toBe('solid')
    expect(result.cssProp).toEqual({ color: 'ink' })
    expect(result.ref).toEqual({ current: null })
    expect(result.styleProps).toEqual({ color: 'brand' })
    expect(result.elementProps).toEqual({})
  })

  it('drops non-object css props instead of resolving them', () => {
    const result = split({ css: 'color: red', color: 'brand' })
    expect(result.cssProp).toBeUndefined()
    expect(result.styleProps).toEqual({ color: 'brand' })
  })

  it('routes condition arms to resolution instead of the DOM', () => {
    const result = split({
      color: 'ink',
      _hover: { color: 'brand' },
      _dark: { color: 'paper' },
      id: 'prim',
    })
    expect(result.styleProps).toEqual({
      color: 'ink',
      _hover: { color: 'brand' },
      _dark: { color: 'paper' },
    })
    expect(result.elementProps).toEqual({ id: 'prim' })
  })

  it('routes selector and at-rule arms the way the engine names them', () => {
    const result = split({
      '&:last-child': { display: 'none' },
      '@media (min-width: 600px)': { display: 'block' },
    })
    expect(result.styleProps).toEqual({
      '&:last-child': { display: 'none' },
      '@media (min-width: 600px)': { display: 'block' },
    })
    expect(result.elementProps).toEqual({})
  })
})
