import * as React from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { Menu } from '../components/Menu'
import { Tabs } from '../components/Tabs'

export function ButtonPage21(): React.ReactElement {
  return (
    <main>
      <Badge />
      <Icon />
      <Tabs />
      <Menu />
      <Button />
    </main>
  )
}
