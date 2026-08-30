# Listbox

Selection and option-management engine. Single/multi selection, disabled skipping, typeahead, keyboard navigation. Built on `RovingFocus`.

```tsx
<Listbox value={value} onChange={setValue} selection="single">
  <Listbox.Option value="alpha">Alpha</Listbox.Option>
  <Listbox.Option value="bravo" disabled>
    Bravo
  </Listbox.Option>
</Listbox>
```

Virtualized lists pass `setSize` and `posInSet` on each mounted option.

## Proposed API

```ts
type ListboxValue = string | string[]

interface ListboxProps {
  children?: React.ReactNode
  selection?: "single" | "multiple"
  value?: ListboxValue | null
  onChange?: (value: ListboxValue | null) => void
  orientation?: "vertical" | "horizontal"
}

interface ListboxOptionProps {
  children?: React.ReactNode
  value: string
  disabled?: boolean
  setSize?: number
  posInSet?: number
}
```

`Listbox` renders `div` with `role="listbox"`. `Listbox.Option` renders `div` with `role="option"`.
