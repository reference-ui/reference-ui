// Unit tests for the Neo primitive factory.
// They take stub css plus props and assert the rendered host attrs.
// Server rendering stands in for the browser; the case proves the paint.

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { SystemStyleObject } from '../../runtime/css/css.ts'
import { createPropSplitter } from './split.ts'
import { createPrimitive, joinClassName, type CssFn } from './factory.ts'

const split = createPropSplitter(['color', 'p'])

function makeDiv(css: CssFn = () => 'mock-class') {
  return createPrimitive({ tag: 'div', displayName: 'Div', layerName: 'test-layer', split, css })
}

describe('createPrimitive', () => {
  it('stamps the marker class, resolved classes, and data-layer', () => {
    const html = renderToStaticMarkup(
      createElement(makeDiv(), { color: 'brand', className: 'extra', children: 'prim' })
    )
    expect(html).toContain('class="ref-div mock-class extra"')
    expect(html).toContain('data-layer="test-layer"')
    expect(html).toContain('>prim</div>')
  })

  it('passes DOM props through and keeps style props off the element', () => {
    const html = renderToStaticMarkup(
      createElement(makeDiv(), { color: 'brand', p: 'sm', id: 'prim' })
    )
    expect(html).toContain('id="prim"')
    expect(html).not.toContain('color=')
    expect(html).not.toContain('p=')
  })

  it('resolves style props plus the css prop through css()', () => {
    const css = vi.fn((_style: SystemStyleObject | undefined, _extra?: SystemStyleObject) => '')
    renderToStaticMarkup(
      createElement(makeDiv(css), { color: 'brand', css: { p: 'sm' } })
    )
    expect(css).toHaveBeenCalledWith({ color: 'brand' }, { p: 'sm' })
  })

  it('resolves condition arms through css() and keeps them off the element', () => {
    const css = vi.fn((_style: SystemStyleObject | undefined, _extra?: SystemStyleObject) => 'mock-class')
    const html = renderToStaticMarkup(
      createElement(makeDiv(css), { color: 'ink', _hover: { color: 'brand' }, id: 'prim' })
    )
    expect(css).toHaveBeenCalledWith({ color: 'ink', _hover: { color: 'brand' } }, undefined)
    expect(html).toContain('id="prim"')
    expect(html).not.toContain('_hover')
  })

  it('restamps nested scopes until a color mode settles the tree', () => {
    const Div = makeDiv()
    const unsettled = renderToStaticMarkup(
      createElement(Div, { color: 'brand' }, createElement(Div, { p: 'sm' }))
    )
    expect(unsettled.match(/data-layer/g)?.length).toBe(2)
    const settled = renderToStaticMarkup(
      createElement(Div, { colorMode: 'dark' }, createElement(Div, { p: 'sm' }))
    )
    expect(settled.match(/data-layer/g)?.length).toBe(1)
  })
})

describe('joinClassName', () => {
  it('drops empties and returns undefined when bare', () => {
    expect(joinClassName('ref-div', '', undefined, 'x')).toBe('ref-div x')
    expect(joinClassName(undefined, '')).toBeUndefined()
  })
})
