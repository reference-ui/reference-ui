/**
 * Direct primitive wrapper component exposing Reference StyleProps at its boundary.
 * Forwards style properties directly into the underlying Div primitive.
 * Emits a style-bearing component during trace analysis.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export interface DirectWrapperProps extends StyleProps {
  label?: string
}

export function DirectWrapper({ label, ...props }: DirectWrapperProps) {
  return <Div {...props}>{label}</Div>
}
