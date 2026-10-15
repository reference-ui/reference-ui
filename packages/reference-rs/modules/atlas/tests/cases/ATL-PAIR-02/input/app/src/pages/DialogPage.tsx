import * as React from 'react'
import { Alert } from '../components/Alert'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { Checkbox } from '../components/Checkbox'
import { Dialog } from '../components/Dialog'
import { Divider } from '../components/Divider'
import { Heading } from '../components/Heading'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'
import { Label } from '../components/Label'
import { Link } from '../components/Link'
import { Menu } from '../components/Menu'
import { Radio } from '../components/Radio'
import { Select } from '../components/Select'
import { Stack } from '../components/Stack'
import { Switch } from '../components/Switch'
import { Table } from '../components/Table'
import { Tabs } from '../components/Tabs'
import { Text } from '../components/Text'
import { Tooltip } from '../components/Tooltip'

export function DialogPage(): React.ReactElement {
  return (
    <main>
      <Dialog>
        <Card />
        <Badge />
        <Input />
        <Label />
        <Icon />
        <Avatar />
        <Tooltip />
        <Stack />
        <Tabs />
        <Alert />
        <Heading />
        <Link />
        <Switch />
        <Text />
        <Checkbox />
        <Menu />
        <Select />
        <Divider />
        <Radio />
        <Table />
      </Dialog>
    </main>
  )
}
