import { css } from '@reference-ui/styled/css'
import { splitCssProps } from '@reference-ui/styled/jsx'
import { box } from '@reference-ui/styled/patterns/box'

/** Same list as generated primitives (`splitPrimitiveProps`). */
const BOX_PATTERN_PROPS_FOR_STYLES = ['weight'] as const

function joinClassName(...parts: Array<string | undefined>): string | undefined {
  const s = parts.filter(Boolean).join(' ').trim()
  return s || undefined
}

/**
 * Same split as generated primitives’ `splitPrimitiveProps`.
 * Keeps Reference UI style/token props separate from passthrough SVG attributes.
 */
export function splitPrimitiveStyleProps<T extends Record<string, unknown>>(props: T) {
  const { className, children, colorMode, ...rest } = props as T & {
    className?: string
    children?: unknown
    colorMode?: unknown
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
    styleProps: { ...styleProps, ...patternStyle } as Record<string, unknown>,
    elementProps: domProps,
  }
}

const REF_SVG_CLASS = 'ref-svg'

/**
 * Matches the `Svg` primitive: `ref-svg` + `box(styleProps)` + optional `css(...)` + user `className`.
 */
export function resolveSvgPrimitiveClassName(
  styleProps: Record<string, unknown>,
  userClassName: string | undefined,
): string | undefined {
  const { css: cssProp, ...boxProps } = styleProps
  const boxClass = box(boxProps as Parameters<typeof box>[0])
  const cssClass = cssProp ? css(cssProp as Parameters<typeof css>[0]) : undefined
  return joinClassName(REF_SVG_CLASS, boxClass, cssClass, userClassName)
}
