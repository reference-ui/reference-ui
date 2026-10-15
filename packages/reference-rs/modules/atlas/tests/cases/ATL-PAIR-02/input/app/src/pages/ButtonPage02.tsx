import * as React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'
import { Select } from '../components/Select'
import { Tabs } from '../components/Tabs'

export function ButtonPage02(): React.ReactElement {
  return (
    <main>
      <Card />
      <Input />
      <Icon />
      <Tabs />
      <Select />
      <Button />
    </main>
  )
}
