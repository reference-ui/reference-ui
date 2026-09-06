import * as React from 'react'
import { DATA_COLOR_MODE_ATTR, RESOLVED_DATA_LAYER_NAME } from './constants'
import {
  ColorModeContext,
  readDocumentColorMode,
  resolveColorModeAttr,
  useColorMode,
} from './color-mode'
import {
  LayerScopeContext,
  resolveLayerScopeAttr,
  shouldEmitLayerScope,
} from './layers'

export interface ResolvedPrimitiveContext {
  providesLayerScope: boolean
  resolvedColorMode: string | undefined
  dataLayerAttr: { 'data-layer'?: string }
  colorModeAttr: { [K in typeof DATA_COLOR_MODE_ATTR]?: string }
  variantAttr: { 'data-variant'?: string }
}

export interface PrimitiveContextResolutionOptions {
  inheritsLayerScope: boolean
  inheritedColorMode?: string
  colorMode?: unknown
  variant?: unknown
  dataLayerName?: string
}

/**
 * Combines layer-scope and color-mode domain rules into the unified attribute
 * and context state required by all primitives.
 */
export function resolvePrimitiveContext({
  inheritsLayerScope,
  inheritedColorMode,
  colorMode,
  variant,
  dataLayerName = RESOLVED_DATA_LAYER_NAME,
}: PrimitiveContextResolutionOptions): ResolvedPrimitiveContext {
  const hasExplicitColorMode = colorMode != null && colorMode !== ''
  const resolvedColorMode = hasExplicitColorMode ? String(colorMode) : inheritedColorMode

  const shouldEmitDataLayer = shouldEmitLayerScope({
    inheritsLayerScope,
    hasExplicitColorMode,
    inheritedColorMode,
    layerName: dataLayerName,
  })

  const dataLayerAttr = resolveLayerScopeAttr(shouldEmitDataLayer, dataLayerName)
  const colorModeAttr = resolveColorModeAttr(resolvedColorMode)
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
 * Unified hook that combines layer-scope and color-mode contexts
 * for primitive components within a React tree.
 */
export function usePrimitiveContext(
  colorMode?: unknown,
  variant?: unknown,
): ResolvedPrimitiveContext {
  const inheritsLayerScope = React.useContext(LayerScopeContext)
  const inheritedColorMode = React.useContext(ColorModeContext)
  const effectiveInheritedColorMode = inheritedColorMode ?? readDocumentColorMode()

  return resolvePrimitiveContext({
    inheritsLayerScope,
    inheritedColorMode: effectiveInheritedColorMode,
    colorMode,
    variant,
  })
}

// Re-export domain contexts and hooks for convenience
export { ColorModeContext, useColorMode, readDocumentColorMode } from './color-mode'
export { LayerScopeContext } from './layers'

// Backward-compatible aliases for existing callers
export const useLayerScopeAttrs = usePrimitiveContext
export const resolveLayerScopeAttrs = resolvePrimitiveContext
export type ResolvedLayerScopeAttrs = ResolvedPrimitiveContext
export type LayerScopeResolutionOptions = PrimitiveContextResolutionOptions
