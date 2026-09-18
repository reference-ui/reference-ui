/**
 * Outside-scope wrapper for ATM-SCAN-02: a StyleProps forwarder into Div.
 * It traces only when the entry set includes it.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type OtherProps = StyleProps & {
  tone?: string
}

export function Other({ tone, ...styleProps }: OtherProps) {
  return <Div data-tone={tone} {...styleProps} />
}
