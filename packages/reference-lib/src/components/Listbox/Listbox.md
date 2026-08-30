# Listbox

Proof: [TESTS.md](./TESTS.md).

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

---

## Problems we own

Listbox is the option engine. Select and list Combobox reuse it. It does not own a popup — that is Popover/Combobox.

### Typeahead + Space

Typed characters match options (Intl.Collator, wrap). While the buffer is live, Space must not select (capture-phase). Debounce ~1s (Aria), not Headless 350ms.

**Vendor.** Aria `useTypeSelect.ts`. Zag `CONTENT.TYPEAHEAD` / `getByTypeahead`. Headless `searchQuery` — shorter window, weaker APG.

**Lift** Aria/Zag. Typeahead lives on RovingFocus; Listbox turns it on.

### Disabled skip

Arrow, Home/End, and typeahead skip disabled options. Aria also has `disabledBehavior: 'selection'` (focusable, not selectable) — leave unless freeze needs it.

### Roving vs active-descendant

Standalone Listbox uses roving tabindex (DOM focus on the option). Inside Combobox, DOM focus stays on the input and the list is virtual (`aria-activedescendant`). Headless moves focus into the listbox — that is a Select pattern, not an editable Combobox kernel.

**Vendor.** Aria `shouldUseVirtualFocus`. Zag can put activedescendant on content or input.

**Lift** Aria dual-mode. Combobox is the virtual-focus consumer; Listbox remains honest as a roving widget when used alone.

### Virtualization freeze-gate

Windowed options must preserve `aria-setsize` / `aria-posinset` and support scroll-to-index. Listbox owns the ARIA; it does not ship a Virtualizer.

**Vendor.** Aria `useOption.ts` `isVirtualized` → posinset/setsize via `getItemCount`. Zag `scrollToIndexFn` + `data-activedescendant` observe. `vendor/tanstack-virtual/packages/virtual-core` — `scrollToIndex`, overscan, reconcile.

**Lift** Aria attrs + Zag hook shape + TanStack scroll math. **Leave** a public Virtualizer component (`VENDOR.md`). One freeze-gate composition must be virtualized (`components.md`).

### Selection

Single and multiple. Shift-extended multi (`extended` in Zag) is extra — freeze only if a composition needs it. Radix has Select, not a reusable Listbox — **leave** as the kernel.

---

## Convergence

**APG:** react-aria `useListBox` / `useOption` / `ListKeyboardDelegate`. **Scroll-to-index:** Zag + tanstack-virtual. **Contrast:** Headless (weaker APG, focus-in-list). **Leave:** Radix Select as Listbox, public virtualizer.
