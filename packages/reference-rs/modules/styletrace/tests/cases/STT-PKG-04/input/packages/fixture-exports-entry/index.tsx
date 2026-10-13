/**
 * Mock package for the exports-over-types station. The top-level `types` field
 * names a body-less declaration, so the tracer must follow `exports` to this
 * source file to find PackageCard's style forwarding.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type PackageCardProps = StyleProps & {
  title?: string
}

export function PackageCard({ title, ...styleProps }: PackageCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
