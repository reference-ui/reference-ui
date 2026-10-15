import * as React from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { Label } from '../components/Label'
import { Stack } from '../components/Stack'

export function ButtonPage18(): React.ReactElement {
  return (
    <main>
      <Badge />
      <Label />
      <Stack />
      <Checkbox />
      <Button />
    </main>
  )
}
