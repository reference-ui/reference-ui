/**
 * Mock fixture-edge-lib package for entry_scope: Edge wraps Div and extends
 * StyleProps. It is an edge target, never an entry, so its name is not emitted.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export interface EdgeProps extends StyleProps {
  tone?: 'neutral' | 'brand'
}

export function Edge({ tone = 'neutral', ...styleProps }: EdgeProps) {
  return <Div data-tone={tone} {...styleProps} />
}
