import type { Properties as CSSProperties } from 'csstype'
import type { JSONSchema4 } from 'json-schema'
import type { StyleProps } from './style'

/** Supported button size variants. */
export type Size = 'sm' | 'lg'

/** JSON Schema extension for button component configuration. */
export interface ButtonSchema extends JSONSchema4 {
  componentName?: string
}

/**
 * Props for the Button component.
 * Extends style props and adds button-specific options.
 */
export interface ButtonProps extends StyleProps {
  /** Preferred size variant. */
  size?: Size
  disabled?: boolean
  /** Optional inline CSS properties. */
  css?: CSSProperties
  schema?: JSONSchema4
}
