// Primitive component factory for Neo generated entries.
// It takes a tag plus split, css, and layer wiring and emits a component.
// Each render splits props, resolves style props through css(), and stamps
// the layer scope plus color mode and variant attrs. Mined from core's
// generated primitives on forwardRef, so ref reaches the host on React
// 17/18/19 alike with ref-as-prop behavior preserved on 19.

import { createElement, forwardRef } from 'react'
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
 * forwardRef carries ref on every React; a ref riding props (React 19
 * ref-as-prop callers, direct render calls) still lands as the fallback.
 */
export function createPrimitive(options: CreatePrimitiveOptions): PrimitiveComponent {
  const { tag, displayName, layerName, split, css } = options
  const Primitive = forwardRef<unknown, Record<string, unknown>>(
    (allProps, forwardedRef): React.ReactElement => {
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
            ref: forwardedRef ?? ref,
            className: classes,
            ...dataLayerAttr,
            ...colorModeAttr,
            ...variantAttr,
            ...elementProps,
            children,
          })
        )
      )
    }
  ) as unknown as PrimitiveComponent
  Primitive.displayName = displayName
  return Primitive
}
