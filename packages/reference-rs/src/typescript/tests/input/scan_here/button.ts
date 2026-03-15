import type { CSSProperties } from 'react'
import type { StyleProps } from './style'

export type Size = 'sm' | 'lg'

export interface ButtonProps extends StyleProps {
  size?: Size
  disabled?: boolean
  css?: CSSProperties
}
