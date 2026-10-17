// Unit tests for the Neo primitive factory.
// They take stub css plus props and assert the rendered host attrs.
// Server rendering stands in for the browser; the case proves the paint.

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CssStyles } from './css-types.js'
import { createPropSplitter } from './split.js'
import { createPrimitive, joinClassName, type CssFn, type PrimitiveComponent } from './factory.js'
import { ColorModeContext, DocumentContext, LayerScopeContext } from './context.js'

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
    const css = vi.fn((_style: CssStyles | CssStyles[], _extra?: CssStyles | CssStyles[]) => '')
    renderToStaticMarkup(
      createElement(makeDiv(css), { color: 'brand', css: { p: 'sm' } })
    )
    expect(css).toHaveBeenCalledWith({ color: 'brand' }, { p: 'sm' })
  })

  it('passes array css props to css() as one merge slot', () => {
    const css = vi.fn((_style: CssStyles | CssStyles[], _extra?: CssStyles | CssStyles[]) => 'mock-class')
    renderToStaticMarkup(
      createElement(makeDiv(css), { css: [{ color: 'blue.300' }, { backgroundColor: 'green.300' }] })
    )
    expect(css).toHaveBeenCalledWith({}, [{ color: 'blue.300' }, { backgroundColor: 'green.300' }])
  })

  it('resolves condition arms through css() and keeps them off the element', () => {
    const css = vi.fn((_style: CssStyles | CssStyles[], _extra?: CssStyles | CssStyles[]) => 'mock-class')
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

function makeNamed(layerName: string): PrimitiveComponent {
  return createPrimitive({ tag: 'div', displayName: 'Div', layerName, split, css: () => 'mock-class' })
}

// A document stand-in that carries html data-color-mode, the way a page sets it.
function documentWithMode(mode: string): Document {
  const documentElement = { getAttribute: (name: string) => (name === 'data-color-mode' ? mode : null) }
  return { documentElement, body: null } as unknown as Document
}

// The data-layer values in document order: one per primitive that stamped its scope.
function layerStamps(html: string): string[] {
  return [...html.matchAll(/data-layer="([^"]*)"/g)].map(match => match[1] ?? '')
}

describe('createPrimitive layer scope across systems', () => {
  it('stamps a primitive of another system nested under an explicit color mode', () => {
    const Outer = makeNamed('outer-sys')
    const Inner = makeNamed('inner-sys')
    const html = renderToStaticMarkup(
      createElement(Outer, { colorMode: 'dark' }, createElement(Inner, {}, 'x'))
    )
    expect(layerStamps(html)).toEqual(['outer-sys', 'inner-sys'])
  })

  it('stamps a primitive of another system nested under an html data-color-mode', () => {
    const Outer = makeNamed('outer-sys')
    const Inner = makeNamed('inner-sys')
    const html = renderToStaticMarkup(
      createElement(
        DocumentContext.Provider,
        { value: documentWithMode('light') },
        createElement(Outer, {}, createElement(Inner, {}, 'x'))
      )
    )
    expect(layerStamps(html)).toEqual(['outer-sys', 'inner-sys'])
  })

  it('stamps the nearest other system again and skips only the same system under a mode', () => {
    const A = makeNamed('a-sys')
    const B = makeNamed('b-sys')
    const html = renderToStaticMarkup(
      createElement(A, { colorMode: 'dark' }, createElement(B, {}, createElement(A, {}, createElement(A, {}, 'x'))))
    )
    expect(layerStamps(html)).toEqual(['a-sys', 'b-sys', 'a-sys'])
  })

  it('keeps a same-system primitive unstamped under a color mode', () => {
    const Same = makeNamed('same-sys')
    const html = renderToStaticMarkup(
      createElement(Same, { colorMode: 'dark' }, createElement(Same, {}, 'x'))
    )
    expect(layerStamps(html)).toEqual(['same-sys'])
  })

  it('treats a legacy true scope as the same system under a color mode', () => {
    const Named = makeNamed('named-sys')
    const html = renderToStaticMarkup(
      createElement(
        ColorModeContext.Provider,
        { value: 'dark' },
        createElement(LayerScopeContext.Provider, { value: true }, createElement(Named, {}, 'x'))
      )
    )
    expect(layerStamps(html)).toEqual([])
  })
})
