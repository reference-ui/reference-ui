import * as React from 'react'
import { Div } from '@reference-ui/react'
import type {
  MaterialSymbolIconComponent,
  MaterialSymbolIconProps,
  MaterialSymbolIconShellProps,
} from './types'

const IconShell = Div as unknown as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconShellProps> & React.RefAttributes<HTMLDivElement>
>

export function createIcon(
  Outline: React.ElementType,
  Filled: React.ElementType,
  displayName: string,
): MaterialSymbolIconComponent {
  const Icon = React.forwardRef<HTMLDivElement, MaterialSymbolIconProps>(function MaterialIcon(
    { variant = 'outline', size = '1em', style, ...rest },
    ref,
  ) {
    const Svg = (variant === 'filled' ? Filled : Outline) as React.ComponentType<
      Record<string, unknown>
    >

    return (
      <IconShell
        ref={ref}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        lineHeight="0"
        flexShrink="0"
        size={size}
        style={style}
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
      </IconShell>
    )
  })
  Icon.displayName = displayName
  return Icon
}
