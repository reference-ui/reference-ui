// Traced source for the CORE-DIAG-56 world. It takes the committed declaration root's `Div` and emits AppCard,
// a wrapper that forwards its style props to it, so styletrace binds AppCard. The spec places an unparseable
// sibling beside this file for the trace, and AppCard must still bind past it.
import { Div } from '@reference-ui/react'

export interface AppCardProps {
  color?: string
  title?: string
}

export function AppCard({ title, ...styleProps }: AppCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
