# Combobox

Proof: [TESTS.md](./TESTS.md).

Coordinates an input with an associated popup while preserving DOM focus and native text editing. Active-descendant, autocomplete modes, suggestion navigation, value commitment, dismissal, restoration of the previous value.

List-based popups use `Listbox`. Nested popups may use `Tree`. Applications may integrate their own grid or dialog popup. Combobox does not own Overlay/Popover positioning as a second runtime.

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
    <Listbox value={value} onChange={setValue}>
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
    <Listbox value={value} onChange={setValue}>
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

## Proposed API

```ts
type ComboboxAutocomplete = "none" | "list" | "both"

interface ComboboxProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  value?: string | null
  onChange?: (value: string | null) => void
  inputValue?: string
  onInputValueChange?: (value: string) => void
  autocomplete?: ComboboxAutocomplete
}

interface ComboboxInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

interface ComboboxTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

interface ComboboxPopupProps
  extends React.HTMLAttributes<HTMLDivElement> {}
```

`Combobox` renders no node. `Combobox.Input` renders `input`. `Combobox.Trigger` renders `button`. `Combobox.Popup` renders `div`.

---

## Problems we own

This is not an overlay library. The nasty problem is **keeping DOM focus in the field** while the list is keyboard-active.

### Focus stays on the input

APG Combobox: the user edits in the text field. The list is `aria-activedescendant`. Moving DOM focus into the list (Headless Listbox) breaks typing.

**Vendor.** Downshift `useCombobox` — activedescendant on the input. Aria `useComboBox.ts`. Zag `combobox.connect.ts`. All three keep focus on the input.

**Lift** all three. Downshift is the clearest prop-getter story for “input owns focus.”

### Autocomplete `none` | `list` | `both`

Maps to `aria-autocomplete` and whether the input is filled as the user arrows. Aria hardcodes `'list'` and TODOs `both`. Zag `inputBehavior`: `none` / `autohighlight` / `autocomplete` → `list` / `both`.

**Lift** Zag’s mode matrix. Freeze Aria’s unfinished `both` as a gate, not a surprise.

### Commit vs Escape revert

Enter commits the highlighted or typed value. Escape restores the previous committed value (and may close). Blur policy is product-sensitive: Aria `commit()` / `revert()`; with `allowsCustomValue`, revert can commit custom. Zag `selectionBehavior` replace/clear/preserve.

**Lift** Aria commit/revert as the canonical story. Controlled `value` + `inputValue` stay application state.

### Select-only button trigger

No text field. Focus on a button with `role="combobox"`, typeahead on the button, list still virtual.

**Vendor.** Downshift `useSelect`. Aria Combobox’s button press focuses an input — different shape.

**Lift** Downshift `useSelect` for the Select composition. Do not invent a second Combobox primitive.

### Filtering

Not Combobox core. cmdk `command-score.ts` is an optional helper for CommandPalette. The dialog around it is our Overlay (`VENDOR.md`).

**Leave.** cmdk’s Radix Dialog wrap, Downshift render-prop API, Zag positioning/layer dismiss baked into the combobox machine (fight Overlay/Popover split).

---

## Convergence

**State:** react-aria `commit`/`revert`. **Focus-in-input + select-only:** downshift `useCombobox` / `useSelect`. **Modes:** Zag vocabulary. Popup chrome is Popover/Overlay, not a third floating runtime.
