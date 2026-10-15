import * as React from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { Select } from '../components/Select'
import { Tabs } from '../components/Tabs'

export function ButtonPage01(): React.ReactElement {
  return (
    <main>
      <Card />
      <Badge />
      <Icon />
      <Tabs />
      <Select />
      <Button />
    </main>
  )
}
