import type * as React from 'react'
import type { DivProps } from '@reference-ui/react'

export type IconVariant = 'outline' | 'filled'
export type IconSizeValue = React.CSSProperties['width']

export type MaterialSymbolIconShellProps = Omit<DivProps, 'size'> & {
  size?: IconSizeValue
}

/** Icon shell is a {@link Div}; style props use the design-system surface (not raw `style` only). */
export type MaterialSymbolIconProps = Omit<DivProps, 'size'> & {
  variant?: IconVariant
  size?: IconSizeValue
}

export type MaterialSymbolIconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconProps> & React.RefAttributes<HTMLDivElement>
>
