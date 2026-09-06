import { describe, expect, it } from 'vitest'
import { LayerScopeContext, resolveLayerScopeAttr, shouldEmitLayerScope } from './layers'

describe('layers', () => {
  it('initializes LayerScopeContext with false default', () => {
    expect(LayerScopeContext).toBeDefined()
  })

  describe('shouldEmitLayerScope', () => {
    it('returns true when outside inherited layer scope', () => {
      expect(
        shouldEmitLayerScope({
          inheritsLayerScope: false,
          hasExplicitColorMode: false,
          layerName: 'my-system',
        })
      ).toBe(true)
    })

    it('returns false when inside inherited layer scope with matching theme', () => {
      expect(
        shouldEmitLayerScope({
          inheritsLayerScope: true,
          hasExplicitColorMode: false,
          inheritedColorMode: 'dark',
          layerName: 'my-system',
        })
      ).toBe(false)
    })

    it('returns true when explicit color mode is provided', () => {
      expect(
        shouldEmitLayerScope({
          inheritsLayerScope: true,
          hasExplicitColorMode: true,
          inheritedColorMode: 'light',
          layerName: 'my-system',
        })
      ).toBe(true)
    })

    it('returns false when layerName is empty or undefined', () => {
      expect(
        shouldEmitLayerScope({
          inheritsLayerScope: false,
          hasExplicitColorMode: false,
          layerName: undefined,
        })
      ).toBe(false)
    })
  })

  describe('resolveLayerScopeAttr', () => {
    it('emits data-layer attribute when shouldEmit is true', () => {
      expect(resolveLayerScopeAttr(true, 'my-system')).toEqual({ 'data-layer': 'my-system' })
    })

    it('returns empty object when shouldEmit is false', () => {
      expect(resolveLayerScopeAttr(false, 'my-system')).toEqual({})
    })
  })
})
