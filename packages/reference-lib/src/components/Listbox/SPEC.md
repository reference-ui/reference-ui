# Listbox SPEC

Current freeze, cases, and proof. Design narrative: [Listbox.md](./Listbox.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/listbox.spec.ts`
Unit: `matrix/lib/tests/unit/listbox.test.ts` (missing)
Page: `/listbox`
Colocated: `./Listbox.test.ts` (Vitest) + `./__e2e__/Listbox.ct.spec.ts` (Playwright CT, React 17/18/19)

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

### Status (2026-09-25 — quarantine-landing Listbox crew; colocated + CT proof only)

| | |
| :--- | :--- |
| Engine | Controlled-only selection; own roving/typeahead/virtual engine (quarantine port). |
| Production | **No** (partial: 29 / 73 named cases proven in-dir). |
| Named `[x]` | 29 / 73 |
| Playwright CT | 25 (React 17/18/19 green; 8 frozen snapshots unmoved) |
| Vitest | 7 (colocated) |

### Gaps & incoherence

- ~~`onChange?: (value: any)` — still untyped~~ typed (features
  campaign: discriminated `ListboxProps<TValue>` overloads keyed on
  `selection`; work-order #1 closed).
- Extra chrome parts (`Section` / `Header` / `Empty`) beyond freeze.
- No `RovingFocus` composition: the port carries its own movement/typeahead
  kernel (quarantine shape); TESTS.md "Owned elsewhere" still routes generic
  movement to `RovingFocus` — convergence is future work.
- `validateVirtualAdapter` is exported but never invoked internally
  (faithful to quarantine); LB-VIRT-09 diagnostics need matrix proof.
- Duplicate detection only fires for same-value options with distinct ids;
  exact-duplicate options (same derived id) slip through (see crew log).
- Unproven in-dir: `LB-DOM-04/05/07/09/11/12`, `LB-GROUP-01..06`,
  `LB-SINGLE-02/03/06/07`, `LB-MULTI-02/04/05/06/07/08`, `LB-KEY-06/07`,
  `LB-POINTER-02/03/04`, `LB-DYNAMIC-03/04/05/06`, `LB-VIRT-04/06/08/09/10`,
  `LB-CB-01/02/04`, `LB-ENV-03`, `LB-A11Y-01`, `LB-COMP-01/02/03`.
  (Quarantine proves all 73 in matrix; re-targeting belongs to matrix crews.)

### Vendor

**Lift:** `vendor/react-spectrum/packages/react-aria-components/test/ListBox.test.js`
and `ListBox.browser.test.tsx`; `@react-aria` selection / `useTypeSelect`;
`vendor/zag/packages/machines/listbox`; `vendor/tanstack-virtual/packages/virtual-core`
(`scrollToIndex`).

**Leave:** Radix Select-as-Listbox; public Virtualizer; Headless
focus-in-list; shift-range / select-all.

### Case index

Proven by colocated Vitest (`Listbox.test.ts`) or CT (`__e2e__`, React
17/18/19) — passing titles contain these IDs:

- `[x]` `LB-DOM-01`, `LB-DOM-02`, `LB-DOM-03`, `LB-DOM-06`, `LB-DOM-08`, `LB-DOM-10`
- `[x]` `LB-SINGLE-01`, `LB-SINGLE-04`, `LB-SINGLE-05`, `LB-SINGLE-08`
- `[x]` `LB-MULTI-01`, `LB-MULTI-03`
- `[x]` `LB-KEY-01`, `LB-KEY-02`, `LB-KEY-03`, `LB-KEY-04`, `LB-KEY-05`
- `[x]` `LB-POINTER-01`
- `[x]` `LB-DYNAMIC-01`, `LB-DYNAMIC-02`
- `[x]` `LB-VIRT-01`, `LB-VIRT-02`, `LB-VIRT-03`, `LB-VIRT-05`, `LB-VIRT-07`
- `[x]` `LB-CB-03` (unit: invalid-shape diagnostic only; valid shape needs Combobox)
- `[x]` `LB-ENV-01`, `LB-ENV-02`
- `[x]` `LB-COMP-04`
- `[ ]` all other TESTS.md IDs (see Gaps; quarantine matrix proof awaits re-targeting)

### Work order

1. Kill `defaultValue` / uncontrolled; type `onChange`. — DONE (features campaign).
2. RovingFocus + disabled skip + typeahead gate.
3. Multiple selection contract.
4. Virtual freeze-gate (`LB-VIRT-*`).
5. Combobox virtual-focus consumer hooks (`LB-CB-*`).
6. Port cases with real IDs.

### Won't do

Visual polish. Shipping a Virtualizer. Shift-select / select-all.

### Done when

Public API matches Listbox.md. Every TESTS.md ID is `[x]` here.
