/**
 * Component that internally renders a Reference primitive but strips StyleProps from its public prop interface.
 * Because its public interface does not expose StyleProps, it must be excluded from traced style hosts.
 * Emits a non-style component during wrapper analysis.
 */
import { Div } from '@reference-ui/react'

export interface StrippedWrapperProps {
  label: string
}

export function StrippedWrapper({ label }: StrippedWrapperProps) {
  return <Div color="red">{label}</Div>
}
