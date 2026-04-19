import * as React from 'react'

import { resolveSvgPrimitiveClassName, splitPrimitiveStyleProps } from './styleProps'
import type { IconProps } from './types'

export function createIcon(
  Outline: React.ElementType,
  Filled: React.ElementType,
  displayName: string,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<IconProps> & React.RefAttributes<SVGSVGElement>
> {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(function MaterialIcon(props, ref) {
    const { variant = 'outline', size, width, height, ...rest } = props
    const { className, children, styleProps, elementProps } = splitPrimitiveStyleProps(
      rest as Record<string, unknown>,
    )
    const mergedClassName = resolveSvgPrimitiveClassName(styleProps, className)
    const Svg = (variant === 'filled' ? Filled : Outline) as React.ComponentType<
      Record<string, unknown>
    >
    const w = width ?? size
    const h = height ?? size

    return (
      <Svg ref={ref} width={w} height={h} className={mergedClassName} {...elementProps}>
        {children as React.ReactNode}
      </Svg>
    )
  })
  Icon.displayName = displayName
  return Icon
}