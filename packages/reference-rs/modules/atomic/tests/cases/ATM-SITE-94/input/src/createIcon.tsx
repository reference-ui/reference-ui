import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { IconSizeValue, MaterialSymbolIconProps } from './types'

const IconShell = Div as unknown as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconProps> & React.RefAttributes<HTMLDivElement>
>

// `size` is resolved here and handed to the shell as a plain width, never forwarded.
function resolveSize(size: IconSizeValue | undefined): string {
  return size === undefined ? '1em' : String(size)
}

export function createIcon(
  Outline: React.ElementType,
  Filled: React.ElementType,
  displayName: string
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconProps> & React.RefAttributes<HTMLDivElement>
> {
  const Icon = React.forwardRef<HTMLDivElement, MaterialSymbolIconProps>(function MaterialIcon(
    { variant = 'outline', size, style, color = 'inherit', ...rest },
    ref
  ) {
    const Svg = (variant === 'filled' ? Filled : Outline) as React.ComponentType<
      Record<string, unknown>
    >
    const resolved = resolveSize(size)

    return (
      <IconShell
        ref={ref}
        data-slot="icon"
        display="inline-flex"
        color={color}
        style={{ width: resolved, height: resolved, ...style }}
        {...rest}
      >
        <Svg width="100%" height="100%" fill="currentColor" />
      </IconShell>
    )
  })
  Icon.displayName = displayName
  return Icon
}
