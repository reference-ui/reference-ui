import * as React from 'react'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'
import { Radio } from '../components/Radio'

export function ButtonPage04(): React.ReactElement {
  return (
    <main>
      <Card />
      <Input />
      <Icon />
      <Alert />
      <Radio />
      <Button />
    </main>
  )
}
