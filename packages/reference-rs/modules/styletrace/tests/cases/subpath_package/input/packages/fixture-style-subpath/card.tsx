/**
 * Mock subpath module for the subpath_package station.
 * PackageCard wraps Div and lives at the ./card export of fixture-style-subpath.
 * The tracer must honor package.json exports rather than the package root.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type PackageCardProps = StyleProps & {
  title?: string
}

export function PackageCard({ title, ...styleProps }: PackageCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
