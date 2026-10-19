// Source root for the CORE-DIAG-58 world. It takes an optional title plus
// forwarded style props and renders them through Div. The spec traces this
// root against a declaration root with no entrypoints, so the trace must
// refuse with STT-E-UNRESOLVED-SURFACE as a coded error.
import { Div } from '@reference-ui/react'

export interface AppCardProps {
  color?: string
  title?: string
}

export function AppCard({ title, ...styleProps }: AppCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
