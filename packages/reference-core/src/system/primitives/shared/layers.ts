import * as React from 'react'
import { RESOLVED_DATA_LAYER_NAME } from './constants'

const LAYER_SCOPE_CONTEXT_SYMBOL = Symbol.for('@reference-ui/LayerScopeContext')

/**
 * React Context indicating whether an ancestor primitive has already established
 * the design-system `data-layer="..."` scope in the DOM.
 */
export const LayerScopeContext: React.Context<boolean> =
  ((globalThis as any)[LAYER_SCOPE_CONTEXT_SYMBOL] ??= React.createContext<boolean>(false))

export interface ShouldEmitLayerScopeOptions {
  inheritsLayerScope: boolean
  hasExplicitColorMode: boolean
  inheritedColorMode?: string
  layerName?: string
}

/**
 * Determines whether the primitive must emit a `data-layer` attribute to establish
 * a DOM layer boundary (e.g. at the root of a tree or across a Portal boundary).
 */
export function shouldEmitLayerScope({
  inheritsLayerScope,
  hasExplicitColorMode,
  inheritedColorMode,
  layerName = RESOLVED_DATA_LAYER_NAME,
}: ShouldEmitLayerScopeOptions): boolean {
  return Boolean(
    layerName != null &&
    layerName !== '' &&
    (!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null)
  )
}

/**
 * Resolves the DOM `data-layer` attribute dictionary.
 */
export function resolveLayerScopeAttr(
  shouldEmit: boolean,
  layerName: string | undefined = RESOLVED_DATA_LAYER_NAME
): { 'data-layer'?: string } {
  return shouldEmit && layerName ? { 'data-layer': layerName } : {}
}
