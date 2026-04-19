import * as React from 'react'
import type { MaterialSymbolIconComponent, MaterialSymbolIconProps } from './types'

export function createIcon(
  Outline: React.ElementType,
  Filled: React.ElementType,
  displayName: string,
): MaterialSymbolIconComponent {
  const Icon = React.forwardRef<HTMLSpanElement, MaterialSymbolIconProps>(function MaterialIcon(
    { variant = 'outline', size = '1em', style, ...rest },
    ref,
  ) {
    const Svg = (variant === 'filled' ? Filled : Outline) as React.ComponentType<
      Record<string, unknown>
    >

    return (
      <span
        ref={ref}
        {...rest}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
          flexShrink: 0,
          width: size,
          height: size,
          ...style,
        }}
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
      </span>
    )
  })
  Icon.displayName = displayName
  return Icon
}
