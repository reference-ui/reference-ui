/**
 * Mock fixture-style-library package used by named_barrel_package.
 * Mirrors the converted fixtures/styletrace-library sources: MyStyleComponent
 * wraps Div and extends StyleProps. Compile copies this tree to
 * node_modules/fixture-style-library so the tracer follows the package import.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type MyStyleComponentProps = StyleProps & {
  title?: string
}

export function MyStyleComponent({ title, ...styleProps }: MyStyleComponentProps) {
  return <Div {...styleProps}>{title}</Div>
}