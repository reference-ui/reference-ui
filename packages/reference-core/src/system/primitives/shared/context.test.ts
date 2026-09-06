import { describe, expect, it } from 'vitest'
import { resolveLayerScopeAttrs } from './context'

describe('resolveLayerScopeAttrs', () => {
  it('emits data-layer when outside inherited layer scope and dataLayerName is configured', () => {
    const result = resolveLayerScopeAttrs({
      inheritsLayerScope: false,
      dataLayerName: 'my-system',
    })

    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'my-system' })
    expect(result.providesLayerScope).toBe(true)
  })

  it('suppresses data-layer when inside inherited layer scope with matching color mode', () => {
    const result = resolveLayerScopeAttrs({
      inheritsLayerScope: true,
      inheritedColorMode: 'dark',
      dataLayerName: 'my-system',
    })

    expect(result.dataLayerAttr).toEqual({})
    expect(result.colorModeAttr).toEqual({ 'data-panda-theme': 'dark' })
    expect(result.providesLayerScope).toBe(true)
  })

  it('re-emits data-layer and explicit color mode when explicit colorMode is provided', () => {
    const result = resolveLayerScopeAttrs({
      inheritsLayerScope: true,
      inheritedColorMode: 'light',
      colorMode: 'dark',
      dataLayerName: 'my-system',
    })

    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'my-system' })
    expect(result.colorModeAttr).toEqual({ 'data-panda-theme': 'dark' })
    expect(result.resolvedColorMode).toBe('dark')
  })

  it('emits data-variant only when variant is non-empty', () => {
    const withVariant = resolveLayerScopeAttrs({
      inheritsLayerScope: true,
      variant: 'primary',
    })
    expect(withVariant.variantAttr).toEqual({ 'data-variant': 'primary' })

    const emptyVariant = resolveLayerScopeAttrs({
      inheritsLayerScope: true,
      variant: '',
    })
    expect(emptyVariant.variantAttr).toEqual({})

    const undefinedVariant = resolveLayerScopeAttrs({
      inheritsLayerScope: true,
      variant: undefined,
    })
    expect(undefinedVariant.variantAttr).toEqual({})
  })
})
