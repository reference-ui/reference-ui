// Shared prop and component types for every Material Symbols icon.
// It takes the Div style-props surface and emits the icon contract: outline/filled
// variant, token or CSS size values, and the ref-forwarding component type the
// generated icons implement.
import type * as React from 'react'
import type { DivProps } from '@reference-ui/react'

export type IconVariant = 'outline' | 'filled'
export type IconSizeToken = 'small' | 'base' | 'large' | 'sm' | 'md' | 'lg'
export type IconSizeValue = IconSizeToken | React.CSSProperties['width']

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
