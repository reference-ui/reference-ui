# RovingFocus

Proof: [TESTS.md](./TESTS.md).

Composite-widget keyboard kernel: roving `tabindex`, arrow movement, Home/End, disabled skipping, optional looping, optional typeahead, optional two-dimensional movement.

Does not add a wrapper node. Slots keyboard behaviour onto a single composite child. Each `RovingFocus.Item` slots `tabindex` onto its child.

```tsx
<RovingFocus orientation="horizontal" loop>
  <Div role="toolbar" aria-label="Formatting">
    <RovingFocus.Item>
      <Button>Bold</Button>
    </RovingFocus.Item>
    <RovingFocus.Item>
      <Button>Italic</Button>
    </RovingFocus.Item>
    <RovingFocus.Item disabled>
      <Button>Underline</Button>
    </RovingFocus.Item>
  </Div>
</RovingFocus>
```

```tsx
<RovingFocus orientation="both" typeahead>
  <Div role="grid" aria-label="Emoji">
    {cells.map((cell) => (
      <RovingFocus.Item key={cell.id}>
        <Button>{cell.label}</Button>
      </RovingFocus.Item>
    ))}
  </Div>
</RovingFocus>
```

`orientation="both"` moves in two dimensions. Typeahead is off by default; Listbox and Menu turn it on. Tabs leave it off.

Toolbar, ToggleGroup, tag lists, and picker grids are documented compositions on top of this — they are not reasons to rebuild the same machinery.

## Proposed API

```ts
interface RovingFocusProps {
  children?: React.ReactNode
  orientation?: "horizontal" | "vertical" | "both"
  loop?: boolean
  typeahead?: boolean
}

interface RovingFocusItemProps {
  children?: React.ReactNode
  disabled?: boolean
}
```

RovingFocus and `RovingFocus.Item` render no extra nodes.

---

## Problems we own

Listbox, Menu, Tabs, and Tree must not each reimplement tabIndex dance, RTL arrow swap, and disabled skipping.

### Roving tabindex + loop + disabled skip

Only one item in the tab sequence. Arrows move among focusable items. Disabled items are not stops. RTL flips horizontal arrows.

**Vendor.** Radix `vendor/radix-primitives/packages/react/roving-focus` — thin, 1D, `loop`, RTL. Aria `useSelectableCollection` is selection-coupled. Ariakit `composite` is the richest.

**Lift** Radix as the skeleton (slot onto a child, no extra node).

### Typeahead

A buffer of typed characters, debounce (~1s in Aria, 350ms in Headless — **leave** Headless timing), wrap-around match. Space during an active search must **not** activate the item (capture-phase). Unicode letters matter (Ariakit).

**Vendor.** Aria `useTypeSelect.ts`. Ariakit `composite-typeahead.tsx`. Radix RovingFocus core has **no** typeahead; Radix Menu has its own.

**Lift** Aria/Ariakit into this primitive so Listbox and Menu do not fork it.

### Two-dimensional movement

`orientation="both"` is picker grids (emoji, date-adjacent palettes). Up/down change row; left/right change column.

**Vendor.** Ariakit `rowId` + directional moves. Aria `ListKeyboardDelegate` `layout: 'grid'`. Radix RF is 1D only — insufficient.

**Lift** Ariakit rows or Aria grid delegate.

### Virtual focus

Combobox keeps DOM focus in the input and paints active-descendant on the list. That is Combobox, not a public RovingFocus mode unless freeze needs a flag. Do not entangle RovingFocus with Aria’s selection manager.

---

## Convergence

**Skeleton:** Radix roving-focus. **Typeahead + 2D:** Ariakit composite / Aria delegates. **Leave:** selection-store coupling, Headless typeahead timing, Toolbar/ToggleGroup as extra primitives.
