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

### Status (2026-09-28 — finish-line P2A micro closer; colocated + CT proof only)

| | |
| :--- | :--- |
| Engine | Controlled-only selection; own roving/typeahead/virtual engine. Kernel composes `getDirection` + `shouldIgnoreTypeaheadKey` only (see Gaps). |
| Production | **No** (73 / 73 named cases proven in-dir; `LB-A11Y-01` structural half only, scanner infra-blocked). |
| Named `[x]` | 73 / 73 (zero `[~]` remain) |
| Playwright CT | 72 (React 17/18/19 green; 8 frozen snapshots unmoved) |
| Vitest | 12 (colocated, incl. `LB-VIRT-01/09`, `LB-MULTI-03`, `LB-DOM-06`, `LB-CB-03`, `LB-ENV-01/02`) |

Suites + results (micro-closer re-run, final tree state):

| Suite | Result |
| :--- | :--- |
| Vitest `Listbox.test.ts` (workspace React 19) | 12 / 12 pass |
| CT React 19 (+ snapshots, 8 baselines unchanged) | 72 / 72 pass |
| CT React 18 (behavioral) | 72 / 72 pass |
| CT React 17 (behavioral) | 72 / 72 pass |

### Gaps & incoherence

- ~~`onChange?: (value: any)` — still untyped~~ typed (features
  campaign: discriminated `ListboxProps<TValue>` overloads keyed on
  `selection`; work-order #1 closed).
- Extra chrome parts (`Section` / `Header` / `Empty`) beyond freeze.
- Partial `RovingFocus` convergence (F2, re-verified P2A against the
  landed kernel): direction (`getDirection`) and the typeahead entry
  guard (`shouldIgnoreTypeaheadKey`) are kernel imports; the search
  model stays local — `TypeaheadModel` still lacks the LB-KEY-04
  empty-buffer cycle branch (cycles only on a non-empty repeat buffer)
  and still uses `toLowerCase` repeat detection vs the collator-based
  local model, so a swap would fork pinned behavior. Arrows keep the
  live-DOM model with kernel parity (neither side guards modifiers on
  arrows; movement never selects); grid is N/A (Listbox is 1D only).
- ~~`validateVirtualAdapter` never invoked internally~~ WIRED (P2A
  verified): indexed registration and the `virtual.items`-change effect
  both invoke it; `LB-VIRT-09` unit + CT green. An atomic adapter
  replacement also drops a stale pending target.
- ~~Duplicate detection only fires for distinct ids~~ CLOSED (P2A
  verified): render-time detection (distinct ids) plus commit-time
  `registerOption` detection (colliding derived ids); `LB-DOM-06`
  unit + `LB-DYNAMIC-05` CT green.
- ~~`LB-CB-02` verify-blocked~~ CLOSED (P2A micro closer): the
  Combobox windowed driver (CB-VIRT-01..03) reads the nested
  Listbox's own `virtual` prop, so the `LB-CB-02` CT now proves
  the full contract against the live Combobox — `scrollToIndex(5)`
  + deferred `aria-activedescendant` until index 5 mounts, then
  its stable ID with logical metadata, commit, and stable
  remount. The `ComboWindowed` window control moved inside the
  popover (same testid) so the window can move without
  dismissing; no new fixture.
- `LB-A11Y-01` is `[x]` on the structural half only (roles, accessible
  names, states, relationships across all six shapes, CT-proven): the
  repo has no configured accessibility scanner (no axe in any
  package.json or node_modules), so the scanner half needs repo-level
  infra outside Listbox scope.

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

- `[x]` `LB-DOM-01` … `LB-DOM-12` (all twelve)
- `[x]` `LB-GROUP-01` … `LB-GROUP-06` (all six)
- `[x]` `LB-SINGLE-01` … `LB-SINGLE-08` (all eight)
- `[x]` `LB-MULTI-01` … `LB-MULTI-08` (all eight)
- `[x]` `LB-KEY-01` … `LB-KEY-07` (all seven)
- `[x]` `LB-POINTER-01` … `LB-POINTER-04` (all four)
- `[x]` `LB-DYNAMIC-01` … `LB-DYNAMIC-06` (all six)
- `[x]` `LB-VIRT-01` … `LB-VIRT-10` (all ten)
- `[x]` `LB-CB-01`, `LB-CB-02`, `LB-CB-03`, `LB-CB-04` (live
  Combobox; `LB-CB-03` invalid shape also unit-pinned)
- `[x]` `LB-ENV-01`, `LB-ENV-02`, `LB-ENV-03`
- `[x]` `LB-A11Y-01` (structural half; scanner infra-blocked — see Gaps)
- `[x]` `LB-COMP-01` … `LB-COMP-04` (all four)

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
