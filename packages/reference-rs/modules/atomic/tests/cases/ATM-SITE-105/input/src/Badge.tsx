/**
 * `Badge` for ATM-SITE-105: a project component made by a higher-order
 * function the trace cannot see through, so no trace admits it as a host.
 */
import type { ComponentType } from 'react'
import { Div } from '@reference-ui/react'

function withTone<P extends object>(Inner: ComponentType<P>) {
  return function Toned(props: P) {
    return <Inner data-tone="loud" {...props} />
  }
}

export const Badge = withTone(Div)
