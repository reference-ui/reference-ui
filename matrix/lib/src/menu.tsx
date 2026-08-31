import * as React from 'react'
import { Menu } from '@reference-ui/lib'

export function MenuFixture() {
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null)

  return (
    <div data-testid="menu-fixture-root">
      <h1>Menu Fixture</h1>

      <div style={{ margin: '16px 0' }}>
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
      </div>

      <p data-testid="menu-action-display">
        Last Action: {selectedAction ?? 'None'}
      </p>
    </div>
  )
}
