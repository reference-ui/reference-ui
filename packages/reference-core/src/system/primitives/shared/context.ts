import * as React from 'react'
import { RESOLVED_DATA_LAYER_NAME } from './constants'

export const LayerScopeContext = React.createContext(false)
export const ColorModeContext = React.createContext<string | undefined>(undefined)

export function useColorMode(): string | undefined {
  return React.useContext(ColorModeContext)
}

export interface ResolvedLayerScopeAttrs {
  providesLayerScope: boolean
  resolvedColorMode: string | undefined
  dataLayerAttr: { 'data-layer'?: string }
  colorModeAttr: { 'data-panda-theme'?: string }
  variantAttr: { 'data-variant'?: string }
}

export interface LayerScopeResolutionOptions {
  inheritsLayerScope: boolean
  inheritedColorMode?: string
  colorMode?: unknown
  variant?: unknown
  dataLayerName?: string
}

/**
 * Pure resolution logic for primitive layer scope context, color mode inheritance,
 * and HTML data-* attribute emission.
 */
export function resolveLayerScopeAttrs({
  inheritsLayerScope,
  inheritedColorMode,
  colorMode,
  variant,
  dataLayerName = RESOLVED_DATA_LAYER_NAME,
}: LayerScopeResolutionOptions): ResolvedLayerScopeAttrs {
  const hasExplicitColorMode = colorMode != null && colorMode !== ''
  const resolvedColorMode = hasExplicitColorMode ? String(colorMode) : inheritedColorMode

  const shouldEmitDataLayer =
    dataLayerName != null &&
    dataLayerName !== '' &&
    (!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null)

  const dataLayerAttr = shouldEmitDataLayer ? { 'data-layer': dataLayerName } : {}
  const colorModeAttr =
    resolvedColorMode != null && resolvedColorMode !== '' ? { 'data-panda-theme': resolvedColorMode } : {}
  const variantAttr = variant != null && variant !== '' ? { 'data-variant': String(variant) } : {}
  const providesLayerScope = inheritsLayerScope || shouldEmitDataLayer

  return {
    providesLayerScope,
    resolvedColorMode,
    dataLayerAttr,
    colorModeAttr,
    variantAttr,
  }
}

/**
 * Hook to resolve layer scope context, color mode inheritance, and HTML data-* attributes
 * for primitive components within a React tree.
 */
export function useLayerScopeAttrs(
  colorMode?: unknown,
  variant?: unknown,
): ResolvedLayerScopeAttrs {
  const inheritsLayerScope = React.useContext(LayerScopeContext)
  const inheritedColorMode = React.useContext(ColorModeContext)
  return resolveLayerScopeAttrs({
    inheritsLayerScope,
    inheritedColorMode,
    colorMode,
    variant,
  })
}
