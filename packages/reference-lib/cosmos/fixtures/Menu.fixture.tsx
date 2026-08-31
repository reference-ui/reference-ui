import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Menu, toast } from '../../src/index'

export default {
  StandardDropdown: () => {
    const [checkedItem, setCheckedItem] = React.useState(true)
    return (
      <Div p="4r">
        <Menu>
          <Menu.Trigger
            px="3r"
            py="1.5r"
            borderRadius="sm"
            bg="ui.button.background"
            color="ui.button.foreground"
            border="1px solid"
            borderColor="ui.field.border"
            cursor="pointer"
          >
            Options Menu ▾
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item onSelect={() => toast.show('Cut selected')}>Cut</Menu.Item>
            <Menu.Item onSelect={() => toast.show('Copy selected')}>Copy</Menu.Item>
            <Menu.Item onSelect={() => toast.show('Paste selected')}>Paste</Menu.Item>
            <Menu.Separator />
            <Menu.CheckboxItem
              checked={checkedItem}
              onCheckedChange={setCheckedItem}
            >
              Show Toolbar
            </Menu.CheckboxItem>
            <Menu.Separator />
            <Menu.Item disabled>Delete (Disabled)</Menu.Item>
          </Menu.Content>
        </Menu>
      </Div>
    )
  },
}
