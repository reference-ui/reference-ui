import * as React from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

export function CoUsagePageA(): React.ReactElement {
  return (
    <main>
      <Card>
        <Button>Primary</Button>
      </Card>
      <Badge>Info</Badge>
    </main>
  )
}