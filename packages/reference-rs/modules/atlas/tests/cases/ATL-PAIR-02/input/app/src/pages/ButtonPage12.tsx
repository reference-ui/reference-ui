import * as React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Label } from '../components/Label'
import { Switch } from '../components/Switch'
import { Tooltip } from '../components/Tooltip'

export function ButtonPage12(): React.ReactElement {
  return (
    <main>
      <Card />
      <Label />
      <Tooltip />
      <Switch />
      <Button />
    </main>
  )
}
