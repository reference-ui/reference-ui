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

/** Props of every Material Symbols icon: the `div` props and style props, plus `variant` and `size`. */
export type MaterialSymbolIconProps = Omit<DivProps, 'size' | 'color'> & {
  /**
   * Glyph style.
   * @default 'outline'
   */
  variant?: IconVariant
  /**
   * Width and height. Numbers are pixels. `small`, `base` and `large` also work.
   * @default 'md'
   */
  size?: IconSizeValue
  /**
   * Glyph colour.
   * @default 'inherit'
   */
  color?: DivProps['color']
}

export type MaterialSymbolIconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconProps> & React.RefAttributes<HTMLDivElement>
>
