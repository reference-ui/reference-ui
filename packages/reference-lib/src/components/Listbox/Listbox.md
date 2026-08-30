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

Virtualized lists provide lightweight logical metadata plus the application's
scroll callback; Reference UI still does not render or measure the window.

## Proposed API

```ts
type ListboxValue = string | string[]

interface VirtualFocusItem {
  value: string
  textValue: string
  disabled?: boolean
}

interface VirtualFocusAdapter {
  items: readonly VirtualFocusItem[]
  scrollToIndex(index: number): void
}

type ListboxVirtualAdapter = VirtualFocusAdapter

interface ListboxProps
  extends Omit<ReferencePartProps<"div">, "onChange"> {
  selection?: "single" | "multiple"
  value?: ListboxValue | null
  onChange?: (value: ListboxValue | null) => void
  orientation?: "vertical" | "horizontal"
  virtual?: ListboxVirtualAdapter
}

interface ListboxOptionProps extends ReferencePartProps<"div"> {
  value: string
  disabled?: boolean
  textValue?: string
  index?: number
}
```

`Listbox` renders `div` with `role="listbox"`. `Listbox.Option` renders `div` with `role="option"`.

Omitted selection/value/orientation means controlled single/null/vertical;
explicit multiple selection with omitted value uses a controlled empty array.

Options may be nested in application-authored `div[role=group]` regions named
with ordinary ARIA. Listbox flattens registered Options in current composed DOM
order for focus/typeahead while leaving group labels and other non-options out
of navigation. A public `Listbox.Group` wrapper would add no invariant beyond
that native markup.

In virtual mode each mounted Option supplies its zero-based logical `index`;
its value/disabled state must match `virtual.items[index]`. Reference UI derives
`aria-setsize`/`aria-posinset`, navigates and typeaheads over the complete
metadata array, and assigns each unique value one stable generated option ID.
It calls `scrollToIndex` for an unmounted target and exposes active focus only
after the matching indexed Option mounts with that ID. The adapter is
metadata/coordination, not a public Virtualizer. `VirtualFocusItem` and
`VirtualFocusAdapter` are shared public contracts: Combobox's custom-grid
bridge extends the same logical metadata and scroll seam, while built-in
Listbox and Tree provide their own movement rules.

---

## Problems we own

Listbox is the option engine. Select and list Combobox reuse it. It does not own a popup — that is Popover/Combobox.

### Typeahead + Space

Typed characters match options with Intl.Collator and wrap-around behavior.
The buffer uses RovingFocus's exact 1000ms inactivity timeout. While it is
live, Space must not select (capture-phase); Headless UI's 350ms timing is
deliberately left.

**Vendor.** Aria `useTypeSelect.ts`. Zag `CONTENT.TYPEAHEAD` / `getByTypeahead`. Headless `searchQuery` — shorter window, weaker APG.

**Lift** Aria/Zag. Typeahead lives on RovingFocus; Listbox turns it on.

### Disabled skip

Arrow, Home/End, and typeahead skip disabled options. Disabled options are
never focusable or selectable in this freeze; React Aria's alternate
focusable-but-not-selectable policy is deliberately left.

### Roving vs active-descendant

Standalone Listbox uses roving tabindex (DOM focus on the option). Inside Combobox, DOM focus stays on the input and the list is virtual (`aria-activedescendant`). Headless moves focus into the listbox — that is a Select pattern, not an editable Combobox kernel.

In Combobox mode the one mounted Option named by the source's active descendant
also publishes `data-active`; every other Option omits it. This is preview
state, independent from controlled `aria-selected`/`data-selected`, and gives
token-aware styling a local hook without application-maintained active state.

**Vendor.** Aria `shouldUseVirtualFocus`. Zag can put activedescendant on content or input.

**Lift** Aria dual-mode. Combobox is the virtual-focus consumer; Listbox remains honest as a roving widget when used alone.

### Virtualization freeze-gate

Windowed options must preserve `aria-setsize` / `aria-posinset` and support scroll-to-index. Listbox owns the ARIA; it does not ship a Virtualizer.

**Vendor.** Aria `useOption.ts` `isVirtualized` → posinset/setsize via `getItemCount`. Zag `scrollToIndexFn` + `data-activedescendant` observe. `vendor/tanstack-virtual/packages/virtual-core` — `scrollToIndex`, overscan, reconcile.

**Lift** Aria attrs + Zag hook shape + TanStack scroll math. **Leave** a public Virtualizer component (`VENDOR.md`). One freeze-gate composition must be virtualized (`components.md`).

### Selection

Single and multiple use independent toggle selection. Shift-extended ranges
and select-all are deliberately outside this freeze. Radix has Select, not a
reusable Listbox — **leave** as the kernel.

---

## Convergence

**APG:** react-aria `useListBox` / `useOption` / `ListKeyboardDelegate`. **Scroll-to-index:** Zag + tanstack-virtual. **Contrast:** Headless (weaker APG, focus-in-list). **Leave:** Radix Select as Listbox, public virtualizer.
