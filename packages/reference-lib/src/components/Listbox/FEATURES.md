# Listbox features

Design-needed follow-ups: each needs a product, UX, or API decision before implementation. Nothing here is test-pinnable as specified.

## 1. Typed `onChange`

**What it does:** Threads the existing unused `ListboxProps<T>` generic through value, `onChange`, `Option`, and the virtual adapter so controlled selection is type-safe end to end.

**API:**

```tsx
ListboxProps<TValue extends string = string> with
  value?: TValue | TValue[] | null
  onChange?: (value: TValue | TValue[] | null) => void
```

shared by `Option`, `VirtualFocusItem`, and `computeNextMultipleSelection`. Still to decide: single-vs-multiple overloads or one union signature; whether unknown multi values (`LB-MULTI-03` append semantics) widen the type; whether virtual items share the generic.

**Recommendation:** Good to add once the overload shape is settled — the generic already exists, so this is pure type safety with no runtime change.

**Implemented:** discriminated overloads keyed on `selection` (`ListboxSingleProps` / `ListboxMultipleProps`): single→`TValue | null`, multiple→`TValue[]`. Unknown multi values stay inside `TValue` (no widening; LB-MULTI-03 append is TValue by construction). The generic is shared by `Option`, `VirtualFocusItem` / `VirtualFocusAdapter`, `validateVirtualAdapter`, and `computeNextMultipleSelection`. Type-only; zero runtime change.

## 2. RovingFocus re-convergence

**What it does:** Replaces Listbox's private movement/typeahead kernel (live-DOM orientation/RTL navigation, `Intl.Collator` typeahead, local direction helper) with shared RovingFocus composition or kernel reuse, with zero public API change.

**API:** No public API change. Internal: re-compose `RovingFocus.Root` / `RovingFocus.Item`, or RovingFocus exports its movement/typeahead kernel (`getDirection`, `TypeaheadModel` reuse, `RF-GRID-*` 2D movement) for Listbox to consume.

**Recommendation:** Worth doing only after RovingFocus exports the seams — don't churn a proven 29-green engine speculatively.

**Partially implemented:** `getDirection` is shared (the local helper is removed; body-identical), and `shouldIgnoreTypeaheadKey` is the printable-character entry guard (IME-composing keys no longer feed the buffer). Swapping in `TypeaheadModel` is not done: the kernel lacks Listbox's empty-buffer cycle branch (`LB-KEY-04` pins focus on apple + `a` → avocado; the kernel returns apple, and a swap experiment failed the component tests), and its repeat detection is `toLowerCase`-based while Listbox's is collator-based (they diverge on e.g. `σ`/`ς`). No public API change.

The divergence from the RovingFocus typeahead kernel (`RovingFocus/typeahead.ts`) still holds: the kernel has no empty-buffer cycle branch (it cycles only when the buffer is already a non-empty repeat run) and uses `toLowerCase` repeat detection. The local model is kept, and `LB-KEY-04` passes on all React majors. Arrows are deliberately not composed: the live-DOM model handles dynamic reorder and disabled skip, and the kernel has no modifier guards on arrows either, so parity holds without a swap. No further convergence is available without forking pinned behavior.

## 3. `Section` / `Header` / `Empty` chrome fate

**What it does:** Resolves the three byte-identical extra chrome exports (`Listbox.Section` / `.Header` / `.Empty`, zero TESTS.md cases, zero in-repo consumers) by removal or legacy documentation.

**API:** Either (a) remove the three exports (breaking) and route all grouping through native `div[role=group]`, or (b) document them as legacy chrome with a removal version.

**Recommendation:** Good to remove at the next breaking pass — zero consumers and native markup covers grouping; deprecate first, then cut.

## 4. `isInsideCombobox` dead context field

**What it does:** Resolves the provided-but-unconsumed `isInsideCombobox` context boolean by either consuming it or deleting it.

**API:** Internal only. Either (a) consume it: `Option` branches combobox-vs-standalone behavior off Listbox context instead of importing `ComboboxContext` directly, or (b) delete the field.

**Recommendation:** Good to resolve when the Listbox context is next touched. It is small either way; take whichever direction Combobox prefers.

**Implemented (field removed):** the unused field was removed from the `ListboxContext` interface and provider. `ListboxContext` is module-private, and a tree-wide grep showed zero consumers, so the field was unobservable outside Listbox. Internal only; no public API change.
