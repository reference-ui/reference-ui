import type * as React from 'react'
import { splitCssProps } from '@reference-ui/styled/jsx'

/** Box pattern props missing from Panda `splitCssProps` (not in is-valid-prop user list). */
export const BOX_PATTERN_PROPS_FOR_STYLES = ['weight'] as const

export interface SplitPrimitivePropsResult<TStyleProps extends Record<string, unknown> = Record<string, unknown>> {
  className?: string
  children?: React.ReactNode
  colorMode?: unknown
  variant?: unknown
  styleProps: TStyleProps
  elementProps: Record<string, unknown>
}

export function splitPrimitiveProps<T extends Record<string, unknown>>(
  props: T,
): SplitPrimitivePropsResult {
  const { className, children, colorMode, variant, ...rest } = props as T & {
    className?: string
    children?: React.ReactNode
    colorMode?: unknown
    variant?: unknown
  }
  const [styleProps, elementProps] = splitCssProps(rest)
  const domProps: Record<string, unknown> = { ...elementProps }
  const patternStyle: Record<string, unknown> = {}
  for (const key of BOX_PATTERN_PROPS_FOR_STYLES) {
    if (key in domProps) {
      patternStyle[key] = domProps[key]
      delete domProps[key]
    }
  }
  return {
    className,
    children,
    colorMode,
    variant,
    styleProps: { ...styleProps, ...patternStyle },
    elementProps: domProps,
  }
}
