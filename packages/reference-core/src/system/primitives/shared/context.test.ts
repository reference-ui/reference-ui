import { describe, expect, it } from 'vitest'
import { DATA_COLOR_MODE_ATTR } from './constants'
import { resolvePrimitiveContext } from './context'

describe('resolvePrimitiveContext', () => {
  it('emits data-layer when outside inherited layer scope and dataLayerName is configured', () => {
    const result = resolvePrimitiveContext({
      inheritsLayerScope: false,
      dataLayerName: 'my-system',
    })

    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'my-system' })
    expect(result.providesLayerScope).toBe(true)
  })

  it('suppresses data-layer when inside inherited layer scope with matching color mode', () => {
    const result = resolvePrimitiveContext({
      inheritsLayerScope: true,
      inheritedColorMode: 'dark',
      dataLayerName: 'my-system',
    })

    expect(result.dataLayerAttr).toEqual({})
    expect(result.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
    expect(result.providesLayerScope).toBe(true)
  })

  it('re-emits data-layer and explicit color mode when explicit colorMode is provided', () => {
    const result = resolvePrimitiveContext({
      inheritsLayerScope: true,
      inheritedColorMode: 'light',
      colorMode: 'dark',
      dataLayerName: 'my-system',
    })

    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'my-system' })
    expect(result.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
    expect(result.resolvedColorMode).toBe('dark')
  })

  it('emits data-layer when inheritsLayerScope is reset to false (e.g. at a Portal boundary)', () => {
    const result = resolvePrimitiveContext({
      inheritsLayerScope: false,
      inheritedColorMode: 'dark',
      dataLayerName: 'my-system',
    })

    expect(result.dataLayerAttr).toEqual({ 'data-layer': 'my-system' })
    expect(result.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
    expect(result.providesLayerScope).toBe(true)
  })

  it('emits data-variant only when variant is non-empty', () => {
    const withVariant = resolvePrimitiveContext({
      inheritsLayerScope: true,
      variant: 'primary',
    })
    expect(withVariant.variantAttr).toEqual({ 'data-variant': 'primary' })

    const emptyVariant = resolvePrimitiveContext({
      inheritsLayerScope: true,
      variant: '',
    })
    expect(emptyVariant.variantAttr).toEqual({})

    const undefinedVariant = resolvePrimitiveContext({
      inheritsLayerScope: true,
      variant: undefined,
    })
    expect(undefinedVariant.variantAttr).toEqual({})
  })
})
