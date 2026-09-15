/**
 * Mock default-export package for the default_export_package station.
 * DefaultCard wraps Div and forwards StyleProps. package.json points "." at this
 * file so the tracer can resolve `import DefaultCard from 'fixture-style-default'`.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type DefaultCardProps = StyleProps & {
  title?: string
}

export default function DefaultCard({ title, ...styleProps }: DefaultCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
