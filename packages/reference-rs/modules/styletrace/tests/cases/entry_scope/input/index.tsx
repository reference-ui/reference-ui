/**
 * Entry file for the entry_scope station: Card forwards into the package
 * Edge without re-exporting it, so only the entry's own name traces.
 */
import { Edge } from 'fixture-edge-lib'
import type { StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Edge {...styleProps}>{title}</Edge>
}
