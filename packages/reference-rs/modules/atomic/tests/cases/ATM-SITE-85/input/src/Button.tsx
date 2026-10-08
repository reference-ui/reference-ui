import type { StyleProps } from './types'
import { Div } from '@reference-ui/react'

export type ButtonProps = StyleProps & {
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary'
}

export function Button({ size = 'md', variant = 'primary', ...rest }: ButtonProps) {
  void size
  void variant
  return <Div {...rest} />
}
