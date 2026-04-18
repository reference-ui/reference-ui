import type { StyleProps } from '@reference-ui/react'
import type * as React from 'react'

export type IconVariant = 'outline' | 'filled'
export type IconSizeValue = StyleProps['width']

/**
 * Material symbol icon: a Reference `Div` wrapper that exposes Reference
 * `StyleProps`, plus `variant` and optional icon sizing props.
 */
export type MaterialSymbolIconProps = StyleProps &
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: IconVariant
    size?: IconSizeValue
  }

export type MaterialSymbolIconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconProps> & React.RefAttributes<HTMLDivElement>
>
