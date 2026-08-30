# Combobox

Proof: [TESTS.md](./TESTS.md).

Coordinates an input with an associated popup while preserving DOM focus and native text editing. Active-descendant, autocomplete modes, suggestion navigation, value commitment, dismissal, restoration of the previous value.

List-based popups use `Listbox`. Nested popups may use `Tree`. Applications
may integrate a grid that supports the same virtual-focus adapter. A dialog
popup moves DOM focus and is instead an input + Popover/Overlay composition.
Combobox does not own Overlay/Popover positioning as a second runtime.

```tsx
<Combobox
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={() => setOpen(false)}
  value={value}
  onChange={setValue}
  inputValue={inputValue}
  onInputValueChange={setInputValue}
>
  <Combobox.Input aria-label="Search people" />
  <Combobox.Popup>
    <Listbox value={value}>
      {options.map((option) => (
        <Listbox.Option key={option.id} value={option.id}>
          {option.label}
        </Listbox.Option>
      ))}
    </Listbox>
  </Combobox.Popup>
</Combobox>
```

Select-only (trigger is a button):

```tsx
<Combobox
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={() => setOpen(false)}
  value={value}
  onChange={setValue}
>
  <Combobox.Trigger>{selectedLabel}</Combobox.Trigger>
  <Combobox.Popup>
    <Listbox value={value}>
      {options.map((option) => (
        <Listbox.Option key={option.id} value={option.id}>
          {option.label}
        </Listbox.Option>
      ))}
    </Listbox>
  </Combobox.Popup>
</Combobox>
```

Select = this select-only shape. Autocomplete = editable input + Listbox. CommandPalette = Overlay + Combobox.

A custom grid keeps its visual/semantic anatomy and supplies only logical
navigation metadata:

```tsx
<Combobox.Popup virtualFocus={gridAdapter} aria-label="Results">
  {visibleRows.map((row) => (
    <div role="row" key={row.id}>
      {row.cells.map((cell) => (
        <Combobox.VirtualItem key={cell.value} index={cell.index}>
          <div role="gridcell">{cell.label}</div>
        </Combobox.VirtualItem>
      ))}
    </div>
  ))}
</Combobox.Popup>
```

## Proposed API

```ts
type ComboboxAutocomplete = "none" | "list" | "both"

type VirtualFocusNavigationKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown"

interface VirtualFocusNavigationRequest {
  key: VirtualFocusNavigationKey
  currentIndex: number | null
  direction: "ltr" | "rtl"
}

interface ComboboxGridAdapter extends VirtualFocusAdapter {
  role: "grid"
  getNextIndex(request: VirtualFocusNavigationRequest): number | null
}

interface ComboboxProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  value?: string | null
  onChange?: (value: string | null) => void
  inputValue?: string
  onInputValueChange?: (value: string) => void
  autocomplete?: ComboboxAutocomplete
  allowCustomValue?: boolean
  closeOnBlur?: boolean
}

interface ComboboxInputProps
  extends Omit<
    ReferencePartProps<"input">,
    "value" | "defaultValue" | "onChange"
  > {}

interface ComboboxTriggerProps
  extends ReferencePartProps<"button"> {}

interface ComboboxPopupProps
  extends ReferencePartProps<"div"> {
  placement?: PopoverPlacement
  offset?: number
  collisionPadding?: number
  strategy?: "absolute" | "fixed"
  flip?: boolean
  shift?: boolean
  virtualFocus?: ComboboxGridAdapter
}

interface ComboboxPortalProps {
  container?: PortalProps["container"]
}

interface ComboboxVirtualItemProps extends ReferenceSlotPartProps {
  index: number
}
```

`Combobox` renders no node. Input renders `input`, Trigger renders
`button[type=button]`, Popup renders `div`, Portal renders no node, and
VirtualItem slots behavior onto one native child without a wrapper. Popup
directly reuses Popover's positioning/policy integration, Overlay's shared
layer stack, and Presence's exit detection, so applications do not wrap
Combobox in another Popover. Its default destination is document body
or the focus source's containing open ShadowRoot.

Popup publishes Popover's resolved side/hide hooks and
`--reference-popover-available-width`,
`--reference-popover-available-height`,
`--reference-popover-anchor-width`,
`--reference-popover-anchor-height`, and
`--reference-popover-transform-origin`. Long result collections can consume
available geometry in CSS without another sizing API or runtime.

Exactly one Input XOR Trigger is the focus source and at most one Popup/Portal
pair is valid. Unprevented native Trigger activation requests open/dismiss
internally, so select-only compositions do not add a second toggle handler.
Omitted `value`/`inputValue` are controlled `null`/`""`; omitted
autocomplete/custom/blur policy is `"list"`/false/true.
Input omits native `value`, `defaultValue`, and `onChange`; root
`inputValue`/`onInputValueChange` are the sole editable-text authority.

Listbox and Tree automatically expose their collection registries when nested
in Combobox. A custom grid passes `virtualFocus` to Popup and wraps each mounted
`gridcell` in `Combobox.VirtualItem`. The adapter's `items` are the complete
logical reading order; values are unique and `textValue` drives typeahead.
Popup takes `role="grid"` from the adapter and the focus source exposes matching
`aria-haspopup`. `getNextIndex` supplies grid topology for navigation keys. A
returned index must be in range and enabled. A Popup must resolve exactly one
collection authority: one built-in Listbox or Tree, or one custom
`virtualFocus` adapter. Competing registries are diagnosed rather than chosen
by render order.

VirtualItem derives a stable ID from item value, applies it to its single
native child, publishes `aria-disabled`/`data-disabled`,
`aria-selected`/`data-selected`, and `data-active`, and composes its
ref/events. Unprevented mouse/pen pointer
movement makes an enabled item active; unprevented click/tap routes one value
commit to the root. If a requested item is not mounted, Combobox calls
`scrollToIndex` once and waits for that VirtualItem before publishing
`aria-activedescendant`; it never points ARIA at absent DOM. Replacing/reordering
adapter metadata tracks active identity by value and cancels stale mount
requests. A duplicate, out-of-range, or non-ref-capable VirtualItem child that
does not resolve to one native element produces a descriptive development
diagnostic and cannot become active.

Inside Combobox, the root `onChange` is the sole commit callback. Nested
Listbox/Tree still own roles, disabled state, and selection ARIA, but do not
also receive an `onChange`; this prevents one option activation from issuing
the same application update twice. Their currently virtual-active
`Listbox.Option` or `Tree.Item` publishes authoritative `data-active` so an
application can style keyboard/pointer preview without querying
`aria-activedescendant`.

---

## Problems we own

This is not an overlay library. The nasty problem is **keeping DOM focus in the field** while the list is keyboard-active.

### Focus stays on the input

APG Combobox: the user edits in the text field. The list is `aria-activedescendant`. Moving DOM focus into the list (Headless Listbox) breaks typing.

**Vendor.** Downshift `useCombobox` — activedescendant on the input. Aria `useComboBox.ts`. Zag `combobox.connect.ts`. All three keep focus on the input.

**Lift** all three. Downshift is the clearest prop-getter story for “input owns focus.”

### Autocomplete `none` | `list` | `both`

Maps to `aria-autocomplete` and whether the input is filled as the user arrows. Aria hardcodes `'list'` and TODOs `both`. Zag `inputBehavior`: `none` / `autohighlight` / `autocomplete` → `list` / `both`.

**Lift** Zag's complete mode matrix. The `both` behavior is a required contract
case rather than an implementation TODO inherited from Aria.

### Commit vs Escape revert

Enter commits the highlighted option or an allowed custom value. While open,
Escape restores the previous committed value, clears the active descendant,
and requests dismissal; while closed it leaves native key behavior untouched.
With `closeOnBlur=true`, blur commits an allowed custom value or restores the
last committed text before requesting dismissal. Zag's alternate
replace/clear/preserve policies are deliberately left.

**Lift** Aria commit/revert as the canonical story. Controlled `value` + `inputValue` stay application state.

### Select-only button trigger

No text field. Focus on a button with `role="combobox"`, typeahead on the button, list still virtual.

**Vendor.** Downshift `useSelect`. Aria Combobox’s button press focuses an input — different shape.

**Lift** Downshift `useSelect` for the Select composition. Do not invent a second Combobox primitive.

### Filtering

Filtering and ranking helpers are application-owned and outside this freeze.
CommandPalette applications may choose their own matcher; Reference UI does
not expose cmdk's `command-score.ts`. The dialog around it is our Overlay
(`VENDOR.md`).

**Leave.** cmdk’s Radix Dialog wrap, Downshift render-prop API, Zag positioning/layer dismiss baked into the combobox machine (fight Overlay/Popover split).

---

## Convergence

**State:** react-aria `commit`/`revert`. **Focus-in-input + select-only:** downshift `useCombobox` / `useSelect`. **Modes:** Zag vocabulary. Popup chrome is Popover/Overlay, not a third floating runtime.
