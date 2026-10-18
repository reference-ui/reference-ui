// Unit tests for the Core primitive context resolution.
// They take scope plus mode options and assert the stamped attrs.
// The pure resolver carries the rules; the hook only reads contexts.

import { describe, expect, it } from 'vitest'
import { DATA_COLOR_MODE_ATTR, resolvePrimitiveContext } from './context.js'

describe('resolvePrimitiveContext', () => {
  it('stamps data-layer on the first primitive in a tree', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: false,
      layerName: 'core-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
    expect(result.providesLayerScope).toBe('core-prim')
  })

  it('stamps with no ancestor scope, with or without a color mode on html', () => {
    const bare = resolvePrimitiveContext({ inheritedLayerScope: undefined, layerName: 'core-prim' })
    expect(bare.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
    const withMode = resolvePrimitiveContext({
      inheritedLayerScope: false,
      inheritedColorMode: 'dark',
      layerName: 'core-prim',
    })
    expect(withMode.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
    expect(withMode.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
  })

  it('stamps under an ancestor of another system, with and without a color mode', () => {
    const withMode = resolvePrimitiveContext({
      inheritedLayerScope: 'core-upstream',
      inheritedColorMode: 'light',
      layerName: 'core-prim',
    })
    expect(withMode.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
    expect(withMode.providesLayerScope).toBe('core-prim')
    const bare = resolvePrimitiveContext({
      inheritedLayerScope: 'core-upstream',
      layerName: 'core-prim',
    })
    expect(bare.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
  })

  it('inherits the scope without restamping a same-system primitive under a color mode', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: 'core-prim',
      inheritedColorMode: 'light',
      layerName: 'core-prim',
    })
    expect(result.dataLayerAttr).toEqual({})
    expect(result.providesLayerScope).toBe('core-prim')
    expect(result.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'light' })
  })

  it('stamps a same-system primitive when no color mode is in effect', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: 'core-prim',
      layerName: 'core-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
  })

  it('treats a legacy true scope as the same system', () => {
    const underMode = resolvePrimitiveContext({
      inheritedLayerScope: true,
      inheritedColorMode: 'light',
      layerName: 'core-prim',
    })
    expect(underMode.dataLayerAttr).toEqual({})
    expect(underMode.providesLayerScope).toBe('core-prim')
    const bare = resolvePrimitiveContext({ inheritedLayerScope: true, layerName: 'core-prim' })
    expect(bare.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
  })

  it('restamps the scope when a color mode is set explicitly', () => {
    const result = resolvePrimitiveContext({
      inheritedLayerScope: 'core-prim',
      inheritedColorMode: 'light',
      colorMode: 'dark',
      layerName: 'core-prim',
    })
    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'core-prim' })
    expect(result.resolvedColorMode).toBe('dark')
  })

  it('stamps variant attrs and skips empty values', () => {
    expect(
      resolvePrimitiveContext({ inheritedLayerScope: 'core-prim', variant: 'solid' }).variantAttr
    ).toEqual({ 'data-variant': 'solid' })
    expect(
      resolvePrimitiveContext({ inheritedLayerScope: 'core-prim', variant: '' }).variantAttr
    ).toEqual({})
  })

  it('emits nothing without a layer name and passes the ancestor scope through', () => {
    const none = resolvePrimitiveContext({ inheritedLayerScope: false })
    expect(none.dataLayerAttr).toEqual({})
    expect(none.providesLayerScope).toBe(false)
    expect(resolvePrimitiveContext({ inheritedLayerScope: 'core-upstream' }).providesLayerScope).toBe(
      'core-upstream'
    )
    expect(resolvePrimitiveContext({ inheritedLayerScope: true }).providesLayerScope).toBe(true)
  })
})
