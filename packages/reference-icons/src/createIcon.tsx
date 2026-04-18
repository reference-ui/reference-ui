import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { MaterialSymbolIconComponent, MaterialSymbolIconProps } from './types'

/**
 * Material glyph wrapped by a Reference `Div`, so the public JSX boundary is a
 * Reference primitive while the incoming Material SVG stays an implementation detail.
 */
export function createIcon(
  Outline: React.ElementType,
  Filled: React.ElementType,
  displayName: string,
): MaterialSymbolIconComponent {
  const Icon = React.forwardRef<HTMLDivElement, MaterialSymbolIconProps>(function MaterialIcon(
    { variant = 'outline', size = '1em', ...rest },
    ref,
  ) {
    const Svg = (variant === 'filled' ? Filled : Outline) as React.ComponentType<
      Record<string, unknown>
    >

    return (
      <Div
        ref={ref}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        lineHeight="0"
        flexShrink="0"
        width={size}
        height={size}
        {...rest}
      >
        <Svg
          width="100%"
          height="100%"
          fill="currentColor"
          color="currentColor"
          aria-hidden="true"
          focusable="false"
          style={{ display: 'block' }}
        />
      </Div>
    )
  })
  Icon.displayName = displayName
  return Icon
}
