/**
 * UserBadge wrapper for the plain_react_wrappers station.
 * Converted from fixtures/atlas-project components: forwards props into the
 * mock fixture-demo-ui package, which has no Reference connection.
 */
import * as React from 'react'
import { Badge, type BadgeProps } from 'fixture-demo-ui'

// Thin wrapper — pre-wires user-facing badge semantics.
export function UserBadge(props: BadgeProps): React.ReactElement {
  return <Badge variant="default" {...props} />
}
