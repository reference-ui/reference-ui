# Menu

Proof: [TESTS.md](./TESTS.md).

`role="menu"` keyboard navigation, item activation, typeahead, nested submenu
orchestration. Built on `RovingFocus`. Composes with `Popover` for dropdown and
context-menu positioning and adopts Overlay's shared layer stack.

```tsx
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
>
  <Popover.Trigger>File</Popover.Trigger>
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

Controlled choice items stay inside the same Menu navigation/layer owner:

```tsx
<Menu>
  <Menu.CheckboxItem checked={showGrid} onChange={setShowGrid}>
    Show grid
  </Menu.CheckboxItem>
  <Menu.RadioGroup value={sort} onChange={setSort} aria-label="Sort by">
    <Menu.RadioItem value="name">Name</Menu.RadioItem>
    <Menu.RadioItem value="date">Date</Menu.RadioItem>
  </Menu.RadioGroup>
  <Menu.LinkItem href="/help">Help</Menu.LinkItem>
</Menu>
```

Menubar is `RovingFocus` over always-visible Menu triggers — a documented composition, not a freeze primitive. ContextMenu is Popover with a virtual pointer `anchor` + Menu (no trigger button).

## Proposed API

```ts
interface MenuProps extends ReferencePartProps<"div"> {
  orientation?: "vertical" | "horizontal"
}

interface MenuItemBaseProps
  extends Omit<ReferencePartProps<"div">, "onSelect"> {
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

interface MenuItemProps extends MenuItemBaseProps {}

interface MenuCheckboxItemProps
  extends Omit<MenuItemBaseProps, "onChange"> {
  checked: boolean | "mixed"
  onChange?: (checked: boolean) => void
}

interface MenuRadioGroupProps
  extends Omit<ReferencePartProps<"div">, "onChange"> {
  value?: string | null
  onChange?: (value: string) => void
}

interface MenuRadioItemProps extends MenuItemBaseProps {
  value: string
}

interface MenuLinkItemProps
  extends Omit<ReferencePartProps<"a">, "onSelect"> {
  href: string
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

interface MenuSeparatorProps
  extends ReferencePartProps<"div"> {}

interface MenuSubProps {
  children?: React.ReactNode
  open?: boolean
  onOpen?: () => void
  onDismiss?: () => void
}

interface MenuSubTriggerProps
  extends ReferencePartProps<"div"> {
  disabled?: boolean
  textValue?: string
}

interface MenuSubContentProps
  extends ReferencePartProps<"div"> {
  placement?: PopoverPlacement
  offset?: number
  collisionPadding?: number
}
```

`Menu` renders `div[role=menu]`. Item, CheckboxItem, and RadioItem render `div`
with `role=menuitem`, `menuitemcheckbox`, and `menuitemradio` respectively.
LinkItem renders `a[role=menuitem]` and retains native link behavior.
RadioGroup renders `div[role=group]`; Separator renders
`div[role=separator]`; SubTrigger renders `div[role=menuitem]`; SubContent
renders `div[role=menu]`.

Omitted root orientation is vertical, every SubContent is vertical, and
omitted Sub `open` is controlled false. An Item's consumer `onSelect` receives
the cancelable native event first. Plain Item defaults `closeOnSelect=true`;
CheckboxItem and RadioItem default it false. An unprevented command requests
dismissal; checkbox activation requests the opposite boolean (`mixed` becomes
true), and radio activation requests its value. Controlled checked/value ARIA
changes only after parent props change. Choice items publish
`aria-checked="true"|"false"|"mixed"` as applicable and
`data-state="checked"|"unchecked"|"mixed"`. If `closeOnSelect` is true, the
state request precedes one complete Menu/Popover-tree dismissal request.

LinkItem defaults `closeOnSelect=true`. An unmodified primary click, Enter, or
Menu-owned Space runs consumer click/selection handlers, then requests
dismissal without canceling the anchor's navigation; prevention cancels both
Menu defaults and navigation, while `target`/`download` retain native effect.
Modified click, middle click, and the browser context menu remain native and do
not masquerade as a plain menu selection. Disabled LinkItem is non-navigable
and outside roving/typeahead targets.

Root Menu adopts its Popover layer rather than registering a duplicate; each
open SubContent contributes one child layer and uses Popover positioning with a
`right-start` default (mirrored in RTL).
Base Menu has no root-hover opening policy. MenuButton opens from explicit
button activation, while ContextMenu composition may translate a context press,
keyboard context command, or long touch into its controlled Popover open and
virtual anchor. Menubar/NavigationMenu hover-open remains a higher-level
composition decision.
Submenu pointer intent uses fixed 100ms open, 300ms close, and 5px grace
padding.
Roving focus onto a closed SubTrigger does not open it. If pointer intent
already opened the Sub without moving focus, the directional open key moves
focus into its first enabled item without issuing a second open request.
An outside interaction in an unregistered extension/password-manager overlay
still dismisses the non-modal Menu once even if that overlay stops later mouse
events; modal Overlay keeps its separately documented stay-open policy.

---

## Problems we own

Menu is the APG keyboard widget. Popover supplies positioning, while Overlay
owns the shared layer stack and outside-dismiss ordering. Do not bake a second
overlay runtime into Menu (Zag/Base UI machines that own dismiss + position).

### Submenu intent geometry

Diagonal pointer travel toward a submenu must not close it or switch to a neighbour. This is the same class of problem as Popover `openOnHover`, with tighter timing.

**Vendor.** Zag `intentPolygon` / `isPointInPolygon` (`packages/machines/menu`). Radix `pointerGraceIntent` / `isPointerInGraceArea` (`packages/react/menu`). Aria `useSafelyMouseToSubmenu.ts` — atan2 angle + 500ms timeout.

**Lift** the converged safe-polygon behavior. The exact internal polygon helper
may be shared with Popover; observable delays, padding, cancellation, and
submenu retention are fixed here.

### Typeahead vs Space activate

Space mid-typeahead must not activate the item or open a submenu.

**Vendor.** Base UI `MenuRoot.test.tsx`. Aria `useTypeSelect`. Radix typeahead via `textContent`.

**Lift** RovingFocus typeahead-session gate (Listbox shares it).

### Nested Escape / layer stack

One Escape closes one submenu level and restores its SubTrigger; another Escape
then reaches the parent level, and only a later Escape can reach an Overlay
behind the menu tree. A menu opened from a dialog is a child layer. This
level-local policy intentionally differs from vendor menus that close the whole
tree from one Escape.

**Vendor.** Radix Menu on `DismissableLayer` + focus-scope branches. e2e `e2e/dropdown-menu.spec.ts`. Zag layer interact-outside.

**Lift** Radix nesting/e2e onto the shared Overlay/Popover/Menu stack. Portalled submenu registers as a FocusLock shard of the ancestor dialog.

### Available height

Long menus must scroll inside the flipped/shifted box. That is Popover `size` middleware on `Popover.Content`, not Menu API.

---

## Convergence

**Layers + e2e:** radix-primitives menu. **Submenu math:** zag intent polygon. **APG keyboard/typeahead:** react-aria. **Leave:** Menu-as-overlay runtime, public context anatomy, NavigationMenu mega-menu as a freeze primitive.
