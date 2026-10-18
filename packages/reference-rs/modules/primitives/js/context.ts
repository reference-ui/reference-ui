// Layer scope plus color mode contexts for Core primitives.
// It takes the system layer name and emits DOM attrs plus providers.
// The scope carries the nearest owning primitive's layer name, so a primitive
// stamps data-layer unless an ancestor of its own system already owns the scope
// and a color mode is in effect. An ancestor of another system always gets a
// fresh stamp, and an explicit colorMode restamps the scope. A bare true from a
// pre-name bundle counts as the same system. Mined from core's shared contexts
// with the layer name passed in instead of replaced at pack time.

import * as React from 'react'

/**
 * DOM attribute name used to scope and activate color mode tokens.
 * core-owned name: there is no panda in core, so core's data-panda-theme
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

/**
 * Layer scope a primitive hands to its subtree: the layer name of the nearest
 * owning primitive. A bare `true` is a pre-name bundle's scope (the same system,
 * by construction), and `false` or `undefined` means no scope above.
 */
export type LayerScope = string | boolean | undefined

/** Layer scope of the nearest primitive above, when any. */
export const LayerScopeContext: React.Context<LayerScope> = sharedContext(
  LAYER_SCOPE_CONTEXT_SYMBOL,
  () => React.createContext<LayerScope>(false)
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
  providesLayerScope: LayerScope
  resolvedColorMode: string | undefined
  dataLayerAttr: { 'data-layer'?: string }
  colorModeAttr: { [K in typeof DATA_COLOR_MODE_ATTR]?: string }
  variantAttr: { 'data-variant'?: string }
}

export interface PrimitiveContextResolutionOptions {
  inheritedLayerScope: LayerScope
  inheritedColorMode?: string
  colorMode?: unknown
  variant?: unknown
  layerName?: string
}

/** Whether an ancestor primitive owns a data-layer scope above this one. */
function hasLayerScope(scope: LayerScope): boolean {
  return scope === true || (typeof scope === 'string' && scope !== '')
}

/**
 * Whether an inherited scope belongs to this primitive's own system. A bare `true`
 * predates layer names, so it counts as the same system and keeps the old rules.
 */
function isSameSystemScope(scope: LayerScope, layerName: string): boolean {
  return scope === true || scope === layerName
}

/**
 * The stamp rule. No ancestor scope, or an ancestor of another system, always stamps.
 * Inside the same system the color mode decides: an explicit or inherited color mode
 * already paints the scope, so the stamp is skipped.
 */
function shouldEmitLayerScope(
  inheritedScope: LayerScope,
  hasExplicitColorMode: boolean,
  inheritedColorMode: string | undefined,
  layerName: string | undefined
): boolean {
  if (layerName == null || layerName === '') return false
  if (!hasLayerScope(inheritedScope)) return true
  if (!isSameSystemScope(inheritedScope, layerName)) return true
  return hasExplicitColorMode || inheritedColorMode == null
}

/**
 * The scope a primitive hands to its subtree: its own layer name when it names one,
 * otherwise the ancestor's scope passed through untouched.
 */
function providedLayerScope(inheritedScope: LayerScope, layerName: string | undefined): LayerScope {
  return layerName != null && layerName !== '' ? layerName : inheritedScope
}

/**
 * Read the active color mode from document root elements when React context
 * is unset (at document level or outside the React tree).
 */
export function readDocumentColorMode(doc?: Document | null): string | undefined {
  const targetDoc = doc ?? globalDocument()
  if (!targetDoc) return undefined
  return modeAttrOf(targetDoc.documentElement) ?? modeAttrOf(targetDoc.body)
}

function globalDocument(): Document | null {
  return typeof document !== 'undefined' ? document : null
}

/** The mode attribute on one element, or undefined when the element is absent or unmarked. */
function modeAttrOf(element: Element | null | undefined): string | undefined {
  return element?.getAttribute(DATA_COLOR_MODE_ATTR) ?? undefined
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
  inheritedLayerScope,
  inheritedColorMode,
  colorMode,
  variant,
  layerName,
}: PrimitiveContextResolutionOptions): ResolvedPrimitiveContext {
  const hasExplicitColorMode = colorMode != null && colorMode !== ''
  const resolvedColorMode = hasExplicitColorMode ? String(colorMode) : inheritedColorMode
  const shouldEmit = shouldEmitLayerScope(
    inheritedLayerScope,
    hasExplicitColorMode,
    inheritedColorMode,
    layerName
  )
  return {
    providesLayerScope: providedLayerScope(inheritedLayerScope, layerName),
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
  const inheritedLayerScope = React.useContext(LayerScopeContext)
  const inheritedColorMode = React.useContext(ColorModeContext)
  const doc = React.useContext(DocumentContext)
  return resolvePrimitiveContext({
    inheritedLayerScope,
    inheritedColorMode: inheritedColorMode ?? readDocumentColorMode(doc),
    colorMode,
    variant,
    layerName,
  })
}
