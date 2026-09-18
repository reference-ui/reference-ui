// Primitive component factory for Neo generated entries.
// It takes a tag plus split, css, and layer wiring and emits a component.
// Each render splits props, resolves style props through css(), and stamps
// the layer scope plus color mode and variant attrs. Mined from core's
// generated primitives with ref-as-prop instead of forwardRef (React 19).

import { createElement } from 'react'
import type * as React from 'react'
import type { CssStyles } from '../../runtime/css/css.ts'
import { ColorModeContext, LayerScopeContext, usePrimitiveContext } from './context.ts'
import type { PropSplitter } from './split.ts'

/** Style resolution seam: the generated entry passes the shared css(). */
export type CssFn = (...styles: Array<CssStyles | CssStyles[]>) => string

export interface CreatePrimitiveOptions {
  tag: string
  displayName: string
  layerName: string
  split: PropSplitter
  css: CssFn
}

export interface PrimitiveComponent {
  (allProps: Record<string, unknown>): React.ReactElement
  displayName: string
}

/** Join class parts, dropping empties; undefined when nothing remains. */
export function joinClassName(...parts: Array<string | undefined>): string | undefined {
  const className = parts.filter(Boolean).join(' ').trim()
  return className || undefined
}

/**
 * Build one tag primitive. The marker class names the tag, the resolved
 * classes carry the style props, and element props plus children land on
 * the host untouched. Providers nest inside-out: layer scope, color mode.
 */
export function createPrimitive(options: CreatePrimitiveOptions): PrimitiveComponent {
  const { tag, displayName, layerName, split, css } = options
  const Primitive = ((allProps: Record<string, unknown>): React.ReactElement => {
    const { className, children, colorMode, variant, cssProp, ref, styleProps, elementProps } =
      split(allProps)
    const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } =
      usePrimitiveContext(colorMode, variant, layerName)
    const classes = joinClassName(`ref-${tag}`, css(styleProps, cssProp) || undefined, className)
    return createElement(
      LayerScopeContext.Provider,
      { value: providesLayerScope },
      createElement(
        ColorModeContext.Provider,
        { value: resolvedColorMode },
        createElement(tag, {
          ref,
          className: classes,
          ...dataLayerAttr,
          ...colorModeAttr,
          ...variantAttr,
          ...elementProps,
          children,
        })
      )
    )
  }) as PrimitiveComponent
  Primitive.displayName = displayName
  return Primitive
}
