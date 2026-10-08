# Listbox features

Design-needed follow-ups from DECISIONS.md: each needs a product, UX, or API decision before implementation. Nothing here is test-pinnable as specified.

## 1. Typed `onChange` (from DECISIONS candidate #1)

**What it does:** Threads the existing unused `ListboxProps<T>` generic through value, `onChange`, `Option`, and the virtual adapter so controlled selection is type-safe end to end.

**API:**

```tsx
ListboxProps<TValue extends string = string> with
  value?: TValue | TValue[] | null
  onChange?: (value: TValue | TValue[] | null) => void
```

shared by `Option`, `VirtualFocusItem`, and `computeNextMultipleSelection`. Still to decide: single-vs-multiple overloads or one union signature; whether unknown multi values (`LB-MULTI-03` append semantics) widen the type; whether virtual items share the generic.

**Maintainer take:** Good to add once the overload shape is settled — the generic already exists, so this is pure type safety with no runtime change.

**Status (features campaign 2026-09-26):** LANDED — discriminated overloads keyed on `selection` (`ListboxSingleProps` / `ListboxMultipleProps`): single→`TValue | null`, multiple→`TValue[]`. Unknown multi values stay inside `TValue` (no widening; LB-MULTI-03 append is TValue by construction). The generic is shared by `Option`, `VirtualFocusItem` / `VirtualFocusAdapter`, `validateVirtualAdapter`, and `computeNextMultipleSelection`. Type-only; zero runtime change.

## 2. RovingFocus re-convergence (from DECISIONS candidate #4)

**What it does:** Replaces Listbox's private movement/typeahead kernel (live-DOM orientation/RTL navigation, `Intl.Collator` typeahead, local direction helper) with shared RovingFocus composition or kernel reuse, with zero public API change.

**API:** No public API change. Internal: re-compose `RovingFocus.Root` / `RovingFocus.Item`, or RovingFocus exports its movement/typeahead kernel (`getDirection`, `TypeaheadModel` reuse, `RF-GRID-*` 2D movement) for Listbox to consume.

**Maintainer take:** Worth doing only after RovingFocus exports the seams — don't churn a proven 29-green engine speculatively.

**Status (features campaign F2 2026-09-26):** PARTIAL — `getDirection` adopted (local helper deleted, body-identical) and `shouldIgnoreTypeaheadKey` adopted as the printable-char entry guard (delta: IME-composing keys no longer feed the buffer — convergent bug fix). `TypeaheadModel` swap VERIFY-BLOCKED: the kernel lacks Listbox's empty-buffer cycle branch (LB-KEY-04 pins focus apple + `a` → avocado; kernel returns apple — proven by swap experiment failing CT) and its repeat detection is `toLowerCase`-based vs Listbox's collator-based (diverge on e.g. `σ`/`ς`). Zero public API change. See crew log `features-Listbox-F2.md`.

**Status (finish-line P2A 2026-09-28):** divergence RE-VERIFIED against the landed P1.1 kernel (`RovingFocus/typeahead.ts`): still no empty-buffer cycle branch (cycles only when the buffer is already a non-empty repeat run) and still `toLowerCase` repeat detection. Local model kept; LB-KEY-04 stays green on all React majors. Arrows deliberately not composed (live-DOM model handles dynamic reorder + disabled skip; kernel has no modifier guards on arrows either, so parity holds without a swap). No further convergence available without forking pinned behavior.

## 3. `Section` / `Header` / `Empty` chrome fate (from DECISIONS candidate #6)

**What it does:** Resolves the three byte-identical extra chrome exports (`Listbox.Section` / `.Header` / `.Empty`, zero TESTS.md cases, zero in-repo consumers) by removal or legacy documentation.

**API:** Either (a) remove the three exports (breaking) and route all grouping through native `div[role=group]`, or (b) document them as legacy chrome with a removal version.

**Maintainer take:** Good to remove at the next breaking pass — zero consumers and native markup covers grouping; deprecate first, then cut.

## 4. `isInsideCombobox` dead context field (from DECISIONS candidate #7)

**What it does:** Resolves the provided-but-unconsumed `isInsideCombobox` context boolean by either consuming it or deleting it.

**API:** Internal only. Either (a) consume it: `Option` branches combobox-vs-standalone behavior off Listbox context instead of importing `ComboboxContext` directly, or (b) delete the field.

**Maintainer take:** Good to resolve at the next context touch — small either way; take whichever direction the Combobox crew prefers and close it.

**Status (features campaign F2 2026-09-26):** LANDED (deleted) — Combobox-F landed without claiming the field; tree-wide grep showed zero consumers and `ListboxContext` is module-private, so the field was unobservable outside Listbox. Removed from the context interface + provider. Internal only; zero public API change.
