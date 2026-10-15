import * as React from 'react'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Divider } from '../components/Divider'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'

export function ButtonPage03(): React.ReactElement {
  return (
    <main>
      <Card />
      <Input />
      <Icon />
      <Alert />
      <Divider />
      <Button />
    </main>
  )
}
