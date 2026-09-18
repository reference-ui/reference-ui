// Unit tests for the Neo primitive context resolution.
// They take scope plus mode options and assert the stamped attrs.
// The pure resolver carries the rules; the hook only reads contexts.

import { describe, expect, it } from 'vitest'
import { DATA_COLOR_MODE_ATTR, resolvePrimitiveContext } from './context.ts'

describe('resolvePrimitiveContext', () => {
  it('stamps data-layer on the first primitive in a tree', () => {
    const result = resolvePrimitiveContext({
      inheritsLayerScope: false,
      layerName: 'neo-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
    expect(result.providesLayerScope).toBe(true)
  })

  it('inherits the scope without restamping nested primitives', () => {
    const result = resolvePrimitiveContext({
      inheritsLayerScope: true,
      inheritedColorMode: 'light',
      layerName: 'neo-prim',
    })
    expect(result.dataLayerAttr).toEqual({})
    expect(result.providesLayerScope).toBe(true)
    expect(result.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'light' })
  })

  it('restamps the scope when a color mode is set explicitly', () => {
    const result = resolvePrimitiveContext({
      inheritsLayerScope: true,
      inheritedColorMode: 'light',
      colorMode: 'dark',
      layerName: 'neo-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
    expect(result.resolvedColorMode).toBe('dark')
  })

  it('stamps variant attrs and skips empty values', () => {
    expect(
      resolvePrimitiveContext({ inheritsLayerScope: true, variant: 'solid' }).variantAttr
    ).toEqual({ 'data-variant': 'solid' })
    expect(
      resolvePrimitiveContext({ inheritsLayerScope: true, variant: '' }).variantAttr
    ).toEqual({})
  })

  it('emits nothing without a layer name', () => {
    const result = resolvePrimitiveContext({ inheritsLayerScope: false })
    expect(result.dataLayerAttr).toEqual({})
    expect(result.providesLayerScope).toBe(false)
  })
})
