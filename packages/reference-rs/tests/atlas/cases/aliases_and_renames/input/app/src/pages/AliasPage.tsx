import * as React from 'react'
import { Button as PrimaryButton } from '../components/Button'
import { UserBadge as IdentityBadge } from '../components/UserBadge'

export function AliasPage(): React.ReactElement {
  return (
    <div>
      <IdentityBadge count={2}>Alerts</IdentityBadge>
      <PrimaryButton variant="solid">Create</PrimaryButton>
      <PrimaryButton variant="ghost">Cancel</PrimaryButton>
    </div>
  )
}
