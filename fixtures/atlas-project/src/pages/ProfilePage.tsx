import * as React from 'react'
import { Button } from '../components/Button'
import { UserBadge } from '../components/UserBadge'

// Button used 1×: variant ghost
// UserBadge used 2×
export function ProfilePage(): React.ReactElement {
  return (
    <div>
      <UserBadge count={5}>Notifications</UserBadge>
      <UserBadge>Status</UserBadge>
      <Button variant="ghost" onClick={() => {}}>
        Edit Profile
      </Button>
    </div>
  )
}
