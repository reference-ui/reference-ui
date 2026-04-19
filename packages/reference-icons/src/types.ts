import type * as React from 'react'

export type IconVariant = 'outline' | 'filled'
export type IconSizeValue = React.CSSProperties['width']

export type MaterialSymbolIconProps = React.HTMLAttributes<HTMLSpanElement> & {
    variant?: IconVariant
    size?: IconSizeValue
  }

export type MaterialSymbolIconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconProps> & React.RefAttributes<HTMLSpanElement>
>
