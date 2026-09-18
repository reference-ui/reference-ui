// Ref forwarding tests for the Neo primitive factory.
// They take the forwardRef render plus canned context and assert host attach.
// The context hook is stubbed so render runs outside a reconciler; the ref
// wiring under test is the exact path React 17/18/19 invoke. Browser proof
// stays in NEO-PRIM-08; the $$typeof assertion pins the all-version shape.

import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createPrimitive, type CssFn, type PrimitiveComponent } from './factory.ts'
import { createPropSplitter } from './split.ts'

vi.mock('./context.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('./context.ts')>()
  return {
    ...actual,
    usePrimitiveContext: () => ({
      providesLayerScope: true,
      resolvedColorMode: undefined,
      dataLayerAttr: { 'data-layer': 'test-layer' },
      colorModeAttr: {},
      variantAttr: {},
    }),
  }
})

interface ForwardedPrimitive {
  $$typeof: symbol
  render: (props: Record<string, unknown>, ref: unknown) => React.ReactElement
}

const split = createPropSplitter(['color', 'p'])

function makeDiv(css: CssFn = () => 'mock-class'): PrimitiveComponent {
  return createPrimitive({ tag: 'div', displayName: 'Div', layerName: 'test-layer', split, css })
}

function asForwarded(component: PrimitiveComponent): ForwardedPrimitive {
  return component as unknown as ForwardedPrimitive
}

/** Drill the two provider shells to the host element React mounts. */
function hostOf(rendered: React.ReactElement): React.ReactElement {
  const outer = rendered.props as { children: React.ReactElement }
  const inner = outer.children.props as { children: React.ReactElement }
  return inner.children
}

function hostRef(rendered: React.ReactElement): unknown {
  return (hostOf(rendered).props as { ref?: unknown }).ref
}

describe('createPrimitive ref forwarding', () => {
  it('exposes a forwardRef component so ref survives React 17/18 stripping', () => {
    const forwarded = asForwarded(makeDiv())
    expect(forwarded.$$typeof).toBe(Symbol.for('react.forward_ref'))
    expect(typeof forwarded.render).toBe('function')
  })

  it('keeps the displayName on the forwarded component', () => {
    expect(makeDiv().displayName).toBe('Div')
  })

  it('attaches the forwarded ref to the underlying host element', () => {
    const ref = { current: null }
    const rendered = asForwarded(makeDiv()).render({ id: 'prim' }, ref)
    expect(hostOf(rendered).type).toBe('div')
    expect(hostRef(rendered)).toBe(ref)
  })

  it('prefers the forwarded ref when a ref also rides props', () => {
    const forwarded = { current: null }
    const viaProps = { current: null }
    const rendered = asForwarded(makeDiv()).render({ id: 'prim', ref: viaProps }, forwarded)
    expect(hostRef(rendered)).toBe(forwarded)
  })

  it('falls back to a ref riding props when nothing is forwarded', () => {
    const viaProps = { current: null }
    const rendered = asForwarded(makeDiv()).render({ id: 'prim', ref: viaProps }, null)
    expect(hostRef(rendered)).toBe(viaProps)
  })
})
