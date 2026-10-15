import * as React from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Label } from '../components/Label'
import { Switch } from '../components/Switch'
import { Tooltip } from '../components/Tooltip'

export function ButtonPage14(): React.ReactElement {
  return (
    <main>
      <Badge />
      <Label />
      <Tooltip />
      <Switch />
      <Button />
    </main>
  )
}
