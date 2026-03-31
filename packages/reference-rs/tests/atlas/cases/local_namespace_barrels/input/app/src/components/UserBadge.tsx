import * as React from 'react'
import { Badge as BaseBadge, type BadgeProps } from '@fixtures/demo-ui'

export type { BadgeProps }

export function UserBadge(props: BadgeProps): React.ReactElement {
  return <BaseBadge {...props} />
}
