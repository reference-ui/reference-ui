import * as React from 'react'
import { Badge, type BadgeProps } from '@fixtures/demo-ui'

// Thin wrapper — pre-wires user-facing badge semantics.
export function UserBadge(props: BadgeProps): React.ReactElement {
  return <Badge variant="default" {...props} />
}
