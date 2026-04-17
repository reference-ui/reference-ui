import * as React from 'react'
import { resolveSvgPrimitiveClassName, splitPrimitiveStyleProps } from './styleProps'
import type { MaterialSymbolIconProps } from './types'

/**
 * Material glyph as the only `<svg>`: same class pipeline as the `Svg` primitive (`ref-svg` + box + css),
 * merged onto the Material component’s props (no wrapper element).
 */
export function createIcon(
  Outline: React.ElementType,
  Filled: React.ElementType,
  displayName: string,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconProps> & React.RefAttributes<SVGSVGElement>
> {
  const Icon = React.forwardRef<SVGSVGElement, MaterialSymbolIconProps>(function MaterialIcon(
    props,
    ref,
  ) {
    const { variant = 'outline', size, width, height, ...rest } = props
    const { className, children, colorMode, styleProps, elementProps } = splitPrimitiveStyleProps(
      rest as Record<string, unknown>,
    )
    const mergedClassName = resolveSvgPrimitiveClassName(styleProps, className)
    const Svg = (variant === 'filled' ? Filled : Outline) as React.ComponentType<
      Record<string, unknown>
    >
    const w = width ?? size
    const h = height ?? size
    const colorModeAttr =
      colorMode != null && colorMode !== '' ? { 'data-panda-theme': String(colorMode) } : {}
    return (
      <Svg
        ref={ref}
        width={w}
        height={h}
        className={mergedClassName}
        {...colorModeAttr}
        {...elementProps}
      >
        {children as React.ReactNode}
      </Svg>
    )
  })
  Icon.displayName = displayName
  return Icon
}
