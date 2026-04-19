import { css } from '@reference-ui/styled/css'
import { splitCssProps } from '@reference-ui/styled/jsx'
import { box } from '@reference-ui/styled/patterns/box'

const BOX_PATTERN_PROPS_FOR_STYLES = ['weight'] as const

function joinClassName(...parts: Array<string | undefined>): string | undefined {
  const value = parts.filter(Boolean).join(' ').trim()
  return value || undefined
}

export function splitPrimitiveStyleProps<T extends Record<string, unknown>>(props: T) {
  const { className, children, ...rest } = props as T & {
    className?: string
    children?: unknown
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
    styleProps: { ...styleProps, ...patternStyle } as Record<string, unknown>,
    elementProps: domProps,
  }
}

export function resolveSvgPrimitiveClassName(
  styleProps: Record<string, unknown>,
  userClassName: string | undefined,
): string | undefined {
  const { css: cssProp, ...boxProps } = styleProps
  const boxClass = box(boxProps as Parameters<typeof box>[0])
  const cssClass = cssProp ? css(cssProp as Parameters<typeof css>[0]) : undefined
  return joinClassName('ref-svg', boxClass, cssClass, userClassName)
}