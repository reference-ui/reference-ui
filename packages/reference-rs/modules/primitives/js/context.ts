// Layer scope plus color mode contexts for Neo primitives.
// It takes the system layer name and emits DOM attrs plus providers.
// The first primitive in a tree stamps data-layer; nested ones inherit it,
// and an explicit colorMode restamps the scope. Mined from core's shared
// contexts with the layer name passed in instead of replaced at pack time.

import * as React from 'react'

/**
 * DOM attribute name used to scope and activate color mode tokens.
 * Neo-owned name: there is no panda in neo, so core's data-panda-theme
 * does not come across — sheets and primitives agree on data-color-mode.
 */
export const DATA_COLOR_MODE_ATTR = 'data-color-mode'

const LAYER_SCOPE_CONTEXT_SYMBOL = Symbol.for('@reference-ui/LayerScopeContext')
const COLOR_MODE_CONTEXT_SYMBOL = Symbol.for('@reference-ui/ColorModeContext')
const DOCUMENT_CONTEXT_SYMBOL = Symbol.for('@reference-ui/DocumentContext')

function contextStore(): Record<symbol, unknown> {
  return globalThis as unknown as Record<symbol, unknown>
}

function sharedContext<T>(symbol: symbol, create: () => React.Context<T>): React.Context<T> {
  const store = contextStore()
  const existing = store[symbol] as React.Context<T> | undefined
  if (existing) return existing
  const created = create()
  store[symbol] = created
  return created
}

/** Whether an ancestor primitive already established the data-layer scope. */
export const LayerScopeContext: React.Context<boolean> = sharedContext(
  LAYER_SCOPE_CONTEXT_SYMBOL,
  () => React.createContext<boolean>(false)
)

/** Inherited color mode within the primitive tree, when any. */
export const ColorModeContext: React.Context<string | undefined> = sharedContext(
  COLOR_MODE_CONTEXT_SYMBOL,
  () => React.createContext<string | undefined>(undefined)
)

/** Document override for color mode reads outside the default document. */
export const DocumentContext: React.Context<Document | null> = sharedContext(
  DOCUMENT_CONTEXT_SYMBOL,
  () => React.createContext<Document | null>(null)
)

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
  layerName?: string
}

function shouldEmitLayerScope(
  inheritsLayerScope: boolean,
  hasExplicitColorMode: boolean,
  inheritedColorMode: string | undefined,
  layerName: string | undefined
): boolean {
  return Boolean(
    layerName != null &&
      layerName !== '' &&
      (!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null)
  )
}

/**
 * Read the active color mode from document root elements when React context
 * is unset (at document level or outside the React tree).
 */
export function readDocumentColorMode(doc?: Document | null): string | undefined {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : null)
  if (!targetDoc) return undefined
  return (
    targetDoc.documentElement?.getAttribute(DATA_COLOR_MODE_ATTR) ??
    targetDoc.body?.getAttribute(DATA_COLOR_MODE_ATTR) ??
    undefined
  )
}

/** Read the inherited or document-level color mode within a React tree. */
export function useColorMode(): string | undefined {
  const contextMode = React.useContext(ColorModeContext)
  const doc = React.useContext(DocumentContext)
  return contextMode ?? readDocumentColorMode(doc)
}

function resolveDataLayerAttr(shouldEmit: boolean, layerName?: string): { 'data-layer'?: string } {
  return shouldEmit && layerName ? { 'data-layer': layerName } : {}
}

function resolveColorModeAttr(mode?: string): { [K in typeof DATA_COLOR_MODE_ATTR]?: string } {
  return mode != null && mode !== '' ? { [DATA_COLOR_MODE_ATTR]: mode } : {}
}

function resolveVariantAttr(variant?: unknown): { 'data-variant'?: string } {
  return variant != null && variant !== '' ? { 'data-variant': String(variant) } : {}
}

/**
 * Combine layer-scope and color-mode rules into the attrs plus context
 * state every primitive needs. Pure: the hook sibling reads the contexts.
 */
export function resolvePrimitiveContext({
  inheritsLayerScope,
  inheritedColorMode,
  colorMode,
  variant,
  layerName,
}: PrimitiveContextResolutionOptions): ResolvedPrimitiveContext {
  const hasExplicitColorMode = colorMode != null && colorMode !== ''
  const resolvedColorMode = hasExplicitColorMode ? String(colorMode) : inheritedColorMode
  const shouldEmit = shouldEmitLayerScope(
    inheritsLayerScope,
    hasExplicitColorMode,
    inheritedColorMode,
    layerName
  )
  return {
    providesLayerScope: inheritsLayerScope || shouldEmit,
    resolvedColorMode,
    dataLayerAttr: resolveDataLayerAttr(shouldEmit, layerName),
    colorModeAttr: resolveColorModeAttr(resolvedColorMode),
    variantAttr: resolveVariantAttr(variant),
  }
}

/** Read both primitive contexts and resolve attrs for one render. */
export function usePrimitiveContext(
  colorMode?: unknown,
  variant?: unknown,
  layerName?: string
): ResolvedPrimitiveContext {
  const inheritsLayerScope = React.useContext(LayerScopeContext)
  const inheritedColorMode = React.useContext(ColorModeContext)
  const doc = React.useContext(DocumentContext)
  return resolvePrimitiveContext({
    inheritsLayerScope,
    inheritedColorMode: inheritedColorMode ?? readDocumentColorMode(doc),
    colorMode,
    variant,
    layerName,
  })
}
