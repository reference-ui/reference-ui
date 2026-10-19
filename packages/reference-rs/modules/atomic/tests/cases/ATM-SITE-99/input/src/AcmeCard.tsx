/**
 * Local wrapper for ATM-SITE-99: forwards StyleProps into Div, so tracing
 * discovers `AcmeCard` as the app's own host. It spells the same name an
 * upstream package publishes.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type AcmeCardProps = StyleProps & {
  title?: string
}

export function AcmeCard({ title, ...styleProps }: AcmeCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
