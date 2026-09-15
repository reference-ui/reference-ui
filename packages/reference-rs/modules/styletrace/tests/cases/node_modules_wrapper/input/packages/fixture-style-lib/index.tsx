/**
 * Mock fixture-style-lib package used by node_modules_wrapper.
 * Exports a PackageCard that wraps Div and extends StyleProps. The station
 * compile step copies this file to node_modules/fixture-style-lib so the tracer
 * can follow the package import without committing a gitignored node_modules tree.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export interface PackageCardProps extends StyleProps {
  tone?: 'neutral' | 'brand'
}

export function PackageCard({ tone = 'neutral', ...styleProps }: PackageCardProps) {
  return <Div data-tone={tone} {...styleProps} />
}
