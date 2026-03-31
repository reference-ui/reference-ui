import * as React from 'react'
import { Card, Badge, type CardProps, type BadgeVariant } from '@fixtures/demo-ui'

type AppCardProps = CardProps & {
  status?: BadgeVariant
  statusLabel?: string
}

// Composition of Card + Badge — surfaces a status badge in the card title area.
export function AppCard({
  status,
  statusLabel,
  title,
  children,
  ...cardProps
}: AppCardProps): React.ReactElement {
  return (
    <Card
      title={title}
      {...cardProps}
      footer={
        status ? <Badge variant={status}>{statusLabel ?? status}</Badge> : undefined
      }
    >
      {children}
    </Card>
  )
}
