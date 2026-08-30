# Combobox

Coordinates an input with an associated popup while preserving DOM focus and native text editing. Active-descendant, autocomplete modes, suggestion navigation, value commitment, dismissal, restoration of the previous value.

List-based popups use `Listbox`. Applications may integrate their own grid, tree, or dialog popup.

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
