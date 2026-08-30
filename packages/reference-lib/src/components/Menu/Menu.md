# Menu

`role="menu"` keyboard navigation, item activation, typeahead, nested submenu orchestration. Built on `RovingFocus`. Composes with `Popover` for dropdown and context menus. Registers on the shared layer stack.

```tsx
<Popover open={open} onDismiss={close}>
  <Popover.Trigger onClick={() => setOpen((prev) => !prev)}>
    File
  </Popover.Trigger>
  <Popover.Content placement="bottom-start">
    <Menu>
      <Menu.Item onSelect={create}>New</Menu.Item>
      <Menu.Item onSelect={openFile}>Open</Menu.Item>
      <Menu.Separator />
      <Menu.Sub>
        <Menu.SubTrigger>Share</Menu.SubTrigger>
        <Menu.SubContent>
          <Menu.Item onSelect={shareEmail}>Email</Menu.Item>
          <Menu.Item onSelect={shareLink}>Copy link</Menu.Item>
        </Menu.SubContent>
      </Menu.Sub>
    </Menu>
  </Popover.Content>
</Popover>
```

## Proposed API

```ts
interface MenuProps {
  children?: React.ReactNode
  orientation?: "vertical" | "horizontal"
}

interface MenuItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
  onSelect?: () => void
}

interface MenuSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {}

interface MenuSubProps {
  children?: React.ReactNode
  open?: boolean
  onOpen?: () => void
  onDismiss?: () => void
}

interface MenuSubTriggerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
}

interface MenuSubContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}
```

`Menu` renders `div` with `role="menu"`. `Menu.Item` renders `div` with `role="menuitem"`. `Menu.Separator` renders `div` with `role="separator"`. `Menu.SubTrigger` renders `div` with `role="menuitem"`. `Menu.SubContent` renders `div` with `role="menu"`.
