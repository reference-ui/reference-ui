/**
 * Library wrapper for the named_barrel station.
 * Converted from fixtures/styletrace-library: exposes StyleProps at its
 * boundary and forwards them onto the Div primitive.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type MyStyleComponentProps = StyleProps & {
  title?: string
}

export function MyStyleComponent({ title, ...styleProps }: MyStyleComponentProps) {
  return <Div {...styleProps}>{title}</Div>
}