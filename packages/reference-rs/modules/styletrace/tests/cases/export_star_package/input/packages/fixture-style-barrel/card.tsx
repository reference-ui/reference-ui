/**
 * Mock card module behind the export-star package barrel.
 * PackageCard wraps Div and is the only style-bearing binding the barrel
 * re-exports. AppCard in the station input forwards those same props.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type PackageCardProps = StyleProps & {
  title?: string
}

export function PackageCard({ title, ...styleProps }: PackageCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
