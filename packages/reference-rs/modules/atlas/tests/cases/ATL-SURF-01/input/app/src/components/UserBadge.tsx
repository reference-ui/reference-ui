import * as React from 'react'
import { Badge, type BadgeProps } from '@fixtures/demo-ui'

export function UserBadge(props: BadgeProps): React.ReactElement {
  return <Badge variant="default" {...props} />
}
