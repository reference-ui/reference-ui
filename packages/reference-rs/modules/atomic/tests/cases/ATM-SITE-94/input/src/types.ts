import type { DivProps } from '@reference-ui/react'

export type IconVariant = 'outline' | 'filled'
export type IconSizeValue = 'small' | 'base' | 'large' | 'sm' | 'md' | 'lg'

export type MaterialSymbolIconProps = Omit<DivProps, 'size'> & {
  variant?: IconVariant
  size?: IconSizeValue
}
