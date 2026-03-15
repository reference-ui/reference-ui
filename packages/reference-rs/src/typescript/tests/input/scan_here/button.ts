import type { Properties as CSSProperties } from 'csstype'
import type { JSONSchema4 } from 'json-schema'
import type { StyleProps } from './style'

export type Size = 'sm' | 'lg'

export interface ButtonSchema extends JSONSchema4 {
  componentName?: string
}

export interface ButtonProps extends StyleProps {
  size?: Size
  disabled?: boolean
  css?: CSSProperties
  schema?: JSONSchema4
}
