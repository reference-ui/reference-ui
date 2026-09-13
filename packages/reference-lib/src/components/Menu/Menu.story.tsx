import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Menu } from './index'

export const Basic = () => {
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <Div mb="4r">
          <Menu>
            <Menu.Trigger data-testid="btn-menu-trigger">
              Open Actions
            </Menu.Trigger>

            <Menu.Content data-testid="menu-content">
              <Menu.Item
                data-testid="menu-item-edit"
                onSelect={() => setSelectedAction('Edit')}
              >
                Edit Document
              </Menu.Item>
              <Menu.Item
                data-testid="menu-item-duplicate"
                onSelect={() => setSelectedAction('Duplicate')}
              >
                Duplicate
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item
                data-testid="menu-item-delete"
                onSelect={() => setSelectedAction('Delete')}
              >
                Delete
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </Div>

        <Span data-testid="menu-action-display" fontSize="3.5r" color="design.text.base">
          Last Action: {selectedAction ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}
