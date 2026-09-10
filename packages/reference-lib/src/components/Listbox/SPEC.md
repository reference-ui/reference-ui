# Listbox SPEC

Current freeze, cases, and proof. Design narrative: [Listbox.md](./Listbox.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/listbox.spec.ts`
Unit: `matrix/lib/tests/unit/listbox.test.ts` (missing)
Page: `/listbox`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Controlled selection. Standalone =
RovingFocus. Inside Combobox = virtual focus / `aria-activedescendant`.
Virtualization is an adapter, not a primitive.

Visual polish is not this gate. No `defaultValue`. No public `Group` /
Virtualizer.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Host | `div[role=listbox]`; Option `div[role=option]` |
| State | `selection?`; controlled `value` / `onChange`; omitted → single / `null` / vertical |
| Groups | application `div[role=group]`; flatten options in DOM order |
| Virtual | `virtual={{ items, scrollToIndex }}`; owns `aria-setsize` / `posinset` |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype click-select. |
| Production | **No.** |
| Named `[x]` | 1 / 73 (`LB-DOM-01`) |
| Playwright | 1 |
| Vitest | 0 |

### Gaps & incoherence

- `defaultValue` + uncontrolled store. Freeze: omission never creates an
  uncontrolled selection store.
- `onChange?: (value: any)`.
- No `virtual` adapter, setsize/posinset, or Combobox activedescendant
  bridge on Listbox.
- Extra chrome parts (`Section` / `Header` / `Empty`) beyond freeze.
- Does not compose RovingFocus as the movement kernel.

### Vendor

**Lift:** `vendor/react-spectrum/packages/react-aria-components/test/ListBox.test.js`
and `ListBox.browser.test.tsx`; `@react-aria` selection / `useTypeSelect`;
`vendor/zag/packages/machines/listbox`; `vendor/tanstack-virtual/packages/virtual-core`
(`scrollToIndex`).

**Leave:** Radix Select-as-Listbox; public Virtualizer; Headless
focus-in-list; shift-range / select-all.

### Case index

- `[x]` `LB-DOM-01`
- `[ ]` remaining `LB-DOM-*`, `LB-GROUP-*`, `LB-SINGLE-*`, `LB-MULTI-*`,
  `LB-KEY-*`, `LB-POINTER-*`, `LB-DYNAMIC-*`, `LB-VIRT-*`, `LB-CB-*`,
  `LB-ENV-*`, `LB-A11Y-01`, `LB-COMP-*`

### Work order

1. Kill `defaultValue` / uncontrolled; type `onChange`.
2. RovingFocus + disabled skip + typeahead gate.
3. Multiple selection contract.
4. Virtual freeze-gate (`LB-VIRT-*`).
5. Combobox virtual-focus consumer hooks (`LB-CB-*`).
6. Port cases with real IDs.

### Won't do

Visual polish. Shipping a Virtualizer. Shift-select / select-all.

### Done when

Public API matches Listbox.md. Every TESTS.md ID is `[x]` here.
