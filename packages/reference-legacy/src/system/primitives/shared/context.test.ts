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

  it('proves colorMode="light" is distinct from omitted colorMode', () => {
    // 1. Explicit light mode: forces explicit layer re-emission and stamps 'light'
    const explicitLight = resolvePrimitiveContext({
      inheritsLayerScope: true,
      inheritedColorMode: 'dark',
      colorMode: 'light',
      dataLayerName: 'my-system',
    })
    expect(explicitLight.resolvedColorMode).toBe('light')
    expect(explicitLight.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'light' })
    expect(explicitLight.dataLayerAttr).toEqual({ 'data-layer': 'my-system' })

    // 2. Omitted colorMode: inherits without overriding or stamping
    const omittedUnderDark = resolvePrimitiveContext({
      inheritsLayerScope: true,
      inheritedColorMode: 'dark',
      colorMode: undefined,
      dataLayerName: 'my-system',
    })
    expect(omittedUnderDark.resolvedColorMode).toBe('dark')
    expect(omittedUnderDark.colorModeAttr).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
    expect(omittedUnderDark.dataLayerAttr).toEqual({})

    // 3. Omitted colorMode with no inherited mode: produces no theme attribute (not 'light')
    const omittedUnset = resolvePrimitiveContext({
      inheritsLayerScope: false,
      inheritedColorMode: undefined,
      colorMode: undefined,
      dataLayerName: 'my-system',
    })
    expect(omittedUnset.resolvedColorMode).toBeUndefined()
    expect(omittedUnset.colorModeAttr).toEqual({})
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
