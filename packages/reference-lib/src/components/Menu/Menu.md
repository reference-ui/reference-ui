# Menu

Proof: [TESTS.md](./TESTS.md).

`role="menu"` keyboard navigation, item activation, typeahead, nested submenu orchestration. Built on `RovingFocus`. Composes with `Popover` for dropdown and context menus. Registers on the shared layer stack with Overlay and Popover.

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

Menubar is `RovingFocus` over always-visible Menu triggers — a documented composition, not a freeze primitive. ContextMenu is Popover with a virtual pointer `anchor` + Menu (no trigger button).

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

---

## Problems we own

Menu is the APG keyboard widget. Popover owns positioning and the layer stack. Do not bake a second overlay runtime into Menu (Zag/Base UI machines that own dismiss + position).

### Submenu intent geometry

Diagonal pointer travel toward a submenu must not close it or switch to a neighbour. This is the same class of problem as Popover `openOnHover`, with tighter timing.

**Vendor.** Zag `intentPolygon` / `isPointInPolygon` (`packages/machines/menu`). Radix `pointerGraceIntent` / `isPointerInGraceArea` (`packages/react/menu`). Aria `useSafelyMouseToSubmenu.ts` — atan2 angle + 500ms timeout.

**Lift** Zag polygon or Radix grace — freeze-gate both. Same math family as Popover’s safe polygon; Menu may share the helper without becoming HoverCard.

### Typeahead vs Space activate

Space mid-typeahead must not activate the item or open a submenu.

**Vendor.** Base UI `MenuRoot.test.tsx`. Aria `useTypeSelect`. Radix typeahead via `textContent`.

**Lift** RovingFocus typeahead-session gate (Listbox shares it).

### Nested Escape / layer stack

Escape closes the submenu first, then the parent menu, then an Overlay behind. A menu opened from a dialog is a child layer.

**Vendor.** Radix Menu on `DismissableLayer` + focus-scope branches. e2e `e2e/dropdown-menu.spec.ts`. Zag layer interact-outside.

**Lift** Radix nesting/e2e onto the shared Overlay/Popover/Menu stack. Portalled submenu registers as a FocusLock shard of the ancestor dialog.

### Available height

Long menus must scroll inside the flipped/shifted box. That is Popover `size` middleware on `Popover.Content`, not Menu API.

---

## Convergence

**Layers + e2e:** radix-primitives menu. **Submenu math:** zag intent polygon. **APG keyboard/typeahead:** react-aria. **Leave:** Menu-as-overlay runtime, public context anatomy, NavigationMenu mega-menu as a freeze primitive.
