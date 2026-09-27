# Combobox SPEC

Current freeze, cases, and proof. Design narrative: [Combobox.md](./Combobox.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/combobox.spec.ts`
Colocated: `Combobox.test.tsx` (84 tests; case IDs throughout)
CT: `__e2e__/Combobox.ct.spec.ts` + `__e2e__/Combobox.touch.ct.spec.ts`
(77 specs, React 17/18/19 + snapshots)
Page: `/combobox`

## Legend

- `[x]` A passing Playwright CT or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts a subset (prototype behavior or one half).

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Root renders no node. Exactly one
Input XOR Trigger. `Popover` is wrapped Overlay.Content. Focus stays in the
field. Do not nest a Popover root. Do not re-audit Overlay geometry.

Visual polish is not this gate. No filtering helpers.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Open | required controlled `open` + `onOpen` / `onDismiss` |
| Value | controlled `value` / `inputValue`; omit → `null` / `""` |
| Defaults | `autocomplete="list"`, `allowCustomValue=false`, `closeOnBlur=true` |
| Popup | Overlay layer; `virtualFocus?` for custom grids |
| Async | `loading?` → listbox `aria-busy`; empty / "no results" spoken via `announce()`, no private live region |
| Commit | root `onChange` is the sole commit; recommitting the identical value is silent (B-36, Listbox single parity) |

### Status (2026-09-25, quarantine-landing reconciliation)

| | |
| :--- | :--- |
| Engine | Hardened prototype. Mounted-only active IDs, native Home/End/PageUp/PageDown, Escape revert, IME guards, dev anatomy diagnostics. |
| Production | **No** (freeze features still out: `loading`/async, Tree bridge). |
| Named `[x]` | 62 / 97 in-dir (+ 5 `[~]` honest partials; matrix layer out of scope) |
| CT | 77 specs (74 + 3 touch; W-24 adds MODE-08, CUSTOM-01/02, COMMIT-02, dialog blur) |
| Vitest | 84 tests (ID'd case pins plus pure-helper support) |

### Gaps & incoherence

- Root `value`/`onChange` are required controlled-only (landed
  2026-09-26 under the HQ no-defaultValue stance; the API freeze test pins
  the controlled contract). Sibling `defaultInputValue` / `defaultOpen`
  stay until the HQ call on sibling uncontrolled props.
- No `loading` or Tree bridge (navigation). `autocomplete` modes,
  `allowCustomValue`, `virtualFocus` / `VirtualItem` / grid adapter, and
  `onEscape` are landed.
- No async contract: `loading?` → `aria-busy` on the listbox and an empty /
  "no results" string routed through `announce()`, not a private live region.
- Enter with no mounted active option resolves the session (#2 custom-value
  semantics: custom commit when allowed, else revert + dismiss); Tab is
  source-gated with the same resolution fallback.
- The pre-existing CT `displays checkmark indicator...` stays a frozen
  visual guard with no catalog ID (rehomed, not dropped).

### Vendor

**Lift:** `vendor/downshift/src/hooks` (`useCombobox`, `useSelect`);
`vendor/react-spectrum/packages/@react-aria/combobox`;
`vendor/zag/packages/machines/combobox` (mode matrix);
`vendor/base-ui/packages/react/src/combobox`.

**Leave:** cmdk score/filter; Zag positioning/dismiss runtime; Downshift
render props; Base UI / Zag `multiple` (`selectionMode`) token-chip combobox
— single-value freeze; multi belongs to a later gate, not this kernel.

### Case index

Proven in-dir (`Combobox.test.tsx` Vitest + `__e2e__` CT):

- `[x]` `CB-DOM-01`, `CB-DOM-02`, `CB-DOM-03`, `CB-DOM-04`, `CB-DOM-05`,
  `CB-DOM-06`, `CB-DOM-07`, `CB-DOM-08`, `CB-DOM-09`, `CB-DOM-11`,
  `CB-DOM-12`
- `[~]` `CB-DOM-10` (defaults only; no blur-dismiss), `CB-A11Y-01`
  (role/relationship assertions across shapes; no automated scan)
- `[x]` `CB-OPEN-01`, `CB-OPEN-02`, `CB-OPEN-03`, `CB-OPEN-04`, `CB-OPEN-05`,
  `CB-OPEN-06`, `CB-OPEN-07`, `CB-OPEN-08`
- `[x]` `CB-EDIT-01`, `CB-EDIT-02`, `CB-EDIT-03`, `CB-EDIT-05`, `CB-EDIT-06`,
  `CB-EDIT-07`, `CB-EDIT-08`, `CB-EDIT-09`
- `[~]` `CB-EDIT-04` (ancestor-scroll dismiss only; no input self-scroll half)
- `[x]` `CB-NAV-01`, `CB-NAV-02`, `CB-NAV-03`, `CB-NAV-04`, `CB-NAV-05`,
  `CB-NAV-06`, `CB-NAV-07`, `CB-NAV-08`
- `[x]` `CB-MODE-01`, `CB-MODE-02`, `CB-MODE-03`, `CB-MODE-04`, `CB-MODE-05`,
  `CB-MODE-06`, `CB-MODE-07`, `CB-MODE-08`
- `[x]` `CB-COMMIT-01`, `CB-COMMIT-02`, `CB-COMMIT-03`, `CB-COMMIT-04`,
  `CB-COMMIT-05`, `CB-COMMIT-06`, `CB-COMMIT-07`, `CB-COMMIT-08`, `CB-COMMIT-09`
- `[x]` `CB-CUSTOM-01`, `CB-CUSTOM-02`
- `[x]` `CB-REVERT-01`, `CB-REVERT-02`, `CB-REVERT-03`, `CB-REVERT-04`,
  `CB-REVERT-05`, `CB-REVERT-06`, `CB-REVERT-07`
- `[x]` `CB-SELECT-01`, `CB-SELECT-02`, `CB-SELECT-03`, `CB-SELECT-04`,
  `CB-SELECT-05`, `CB-SELECT-06`, `CB-SELECT-07`
- `[x]` `CB-SELECT-08` (non-virtual + `virtualFocus` grid Home/End/Page with
  `scrollToIndex` wait)
- `[x]` `CB-CLOSE-01`, `CB-CLOSE-02`, `CB-CLOSE-04`, `CB-CLOSE-05`
- `[x]` `CB-ADAPTER-01`, `CB-ADAPTER-02`, `CB-ADAPTER-03`, `CB-ADAPTER-04`,
  `CB-ADAPTER-05`, `CB-ADAPTER-06`, `CB-ADAPTER-07`, `CB-ADAPTER-08`
  (grid halves; windowed-Listbox VIRT halves verify-blocked on the
  Listbox upward registry)
- `[x]` `CB-COMP-02` (filtered both-mode; list-mode peers cover the list
  fixture)
- `[x]` `CB-ENV-01`, `CB-ENV-02`, `CB-ENV-05`

Cross-owned proofs (handoff cases, Combobox side): `LB-CB-01`, `LB-CB-03`
valid shape, `LB-CB-04` (+ highlight snapshot), `FI-COMP-04` commit/remove
flows. `LB-CB-02` (windowed) needs `virtualFocus` — not proven.

Not proven (need freeze features outside this mission): `CB-VIRT-*`
(verify-blocked: Listbox upward registry), `CB-TREE-01` (verify-blocked:
circular Tree/Combobox contract), `CB-CLOSE-03`, `CB-ENV-03`, `CB-ENV-04`,
`CB-COMP-01` (needs VIRT), `CB-COMP-03` (needs Tree bridge).

### Work order

1. Controlled-only `open` / `value` / `inputValue`; freeze callback names.
2. Focus-in-field + activedescendant over Listbox (Listbox first).
3. Commit / Escape revert + blur policy.
4. Select-only Trigger.
5. `autocomplete` none/inline/list/both (landed, W-24).
6. `loading` → `aria-busy` + `announce()` empty/no-results messaging.
7. `virtualFocus` + Tree; then ID’d e2e.

### Won't do

Filtering/ranking. CommandPalette product. Overlay kernel rewrite.
**Multiple selection / token chips** (single-value freeze; revisit as a
named later gate, not a silent omission).

### Done when

Public API matches Combobox.md. Every TESTS.md ID is `[x]` here. Overlay
catalogs stay on Overlay.
