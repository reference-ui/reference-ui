import * as React from 'react'
import { Button } from '../components/Button'
import { UserBadge } from '../components/UserBadge'

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
