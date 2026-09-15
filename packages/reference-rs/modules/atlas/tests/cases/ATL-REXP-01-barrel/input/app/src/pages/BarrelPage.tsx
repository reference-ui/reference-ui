import * as React from 'react'
import { Button, UserBadge } from '../components'

export function BarrelPage(): React.ReactElement {
  return (
    <div>
      <UserBadge count={3}>Alerts</UserBadge>
      <Button>Open</Button>
      <Button>Close</Button>
    </div>
  )
}
