import * as React from 'react'
import * as DemoUi from '@fixtures/demo-ui'

export function DashboardPage(): React.ReactElement {
  return (
    <div>
      <DemoUi.Badge count={1}>Inbox</DemoUi.Badge>
      <DemoUi.Button variant="solid">Launch</DemoUi.Button>
      <DemoUi.Button variant="ghost">Dismiss</DemoUi.Button>
    </div>
  )
}