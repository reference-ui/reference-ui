// Unit tests for the Neo primitive context resolution.
// They take scope plus mode options and assert the stamped attrs.
// The pure resolver carries the rules; the hook only reads contexts.

import { describe, expect, it } from 'vitest'
import { DATA_COLOR_MODE_ATTR, resolvePrimitiveContext } from './context.js'

describe('resolvePrimitiveContext', () => {
  it('stamps data-layer on the first primitive in a tree', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: false,
      layerName: 'neo-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
    expect(result.providesLayerScope).toBe('neo-prim')
  })

  it('stamps with no ancestor scope, with or without a color mode on html', () => {
    const bare = resolvePrimitiveContext({ inheritedLayerScope: undefined, layerName: 'neo-prim' })
    expect(bare.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
    const withMode = resolvePrimitiveContext({
      inheritedLayerScope: false,
      inheritedColorMode: 'dark',
      layerName: 'neo-prim',
    })
    expect(withMode.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
    expect(withMode.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
  })

  it('stamps under an ancestor of another system, with and without a color mode', () => {
    const withMode = resolvePrimitiveContext({
      inheritedLayerScope: 'neo-upstream',
      inheritedColorMode: 'light',
      layerName: 'neo-prim',
    })
    expect(withMode.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
    expect(withMode.providesLayerScope).toBe('neo-prim')
    const bare = resolvePrimitiveContext({
      inheritedLayerScope: 'neo-upstream',
      layerName: 'neo-prim',
    })
    expect(bare.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
  })

  it('inherits the scope without restamping a same-system primitive under a color mode', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: 'neo-prim',
      inheritedColorMode: 'light',
      layerName: 'neo-prim',
    })
    expect(result.dataLayerAttr).toEqual({})
    expect(result.providesLayerScope).toBe('neo-prim')
    expect(result.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'light' })
  })

  it('stamps a same-system primitive when no color mode is in effect', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: 'neo-prim',
      layerName: 'neo-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
  })

  it('treats a legacy true scope as the same system', () => {
    const underMode = resolvePrimitiveContext({
      inheritedLayerScope: true,
      inheritedColorMode: 'light',
      layerName: 'neo-prim',
    })
    expect(underMode.dataLayerAttr).toEqual({})
    expect(underMode.providesLayerScope).toBe('neo-prim')
    const bare = resolvePrimitiveContext({ inheritedLayerScope: true, layerName: 'neo-prim' })
    expect(bare.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
  })

  it('restamps the scope when a color mode is set explicitly', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: 'neo-prim',
      inheritedColorMode: 'light',
      colorMode: 'dark',
      layerName: 'neo-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'neo-prim' })
    expect(result.resolvedColorMode).toBe('dark')
  })

  it('stamps variant attrs and skips empty values', () => {
    expect(
      resolvePrimitiveContext({ inheritedLayerScope: 'neo-prim', variant: 'solid' }).variantAttr
    ).toEqual({ 'data-variant': 'solid' })
    expect(
      resolvePrimitiveContext({ inheritedLayerScope: 'neo-prim', variant: '' }).variantAttr
    ).toEqual({})
  })

  it('emits nothing without a layer name and passes the ancestor scope through', () => {
    const none = resolvePrimitiveContext({ inheritedLayerScope: false })
    expect(none.dataLayerAttr).toEqual({})
    expect(none.providesLayerScope).toBe(false)
    expect(resolvePrimitiveContext({ inheritedLayerScope: 'neo-upstream' }).providesLayerScope).toBe(
      'neo-upstream'
    )
    expect(resolvePrimitiveContext({ inheritedLayerScope: true }).providesLayerScope).toBe(true)
  })
})
