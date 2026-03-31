import * as React from 'react'
import * as UI from '../components'

export function LocalNamespaceBarrelsPage(): React.ReactElement {
  return (
    <main>
      <UI.Button variant="solid">Create</UI.Button>
      <UI.Button variant="ghost">Cancel</UI.Button>
      <UI.UserBadge tone="info">New</UI.UserBadge>
    </main>
  )
}