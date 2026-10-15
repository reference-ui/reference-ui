import * as React from 'react'
import { Alert } from '../components/Alert'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { Table } from '../components/Table'

export function ButtonPage05(): React.ReactElement {
  return (
    <main>
      <Card />
      <Input />
      <Avatar />
      <Alert />
      <Table />
      <Button />
    </main>
  )
}
