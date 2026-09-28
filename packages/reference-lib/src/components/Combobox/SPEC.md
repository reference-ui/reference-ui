# Combobox SPEC

Current freeze, cases, and proof. Design narrative: [Combobox.md](./Combobox.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/combobox.spec.ts`
Colocated: `Combobox.test.tsx` (94 tests; case IDs throughout)
CT: `__e2e__/Combobox.ct.spec.ts` + `__e2e__/Combobox.touch.ct.spec.ts`
(105 specs, React 17/18/19 + snapshots on 19)
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

### Status (2026-09-28, finish-line P2A micro closer)

| | |
| :--- | :--- |
| Engine | Hardened prototype. Mounted-only active IDs, native Home/End/PageUp/PageDown, Escape revert, IME guards, dev anatomy diagnostics, `loading`/async policy, windowed-Listbox driver, native Tree bridge (TR-CB-01–06; TEMP harness deleted). |
| Production | **No** (async red on React 17 is Announcer-owned; all else green). |
| Named `[x]` | 98 / 98 in-dir (zero `[~]`; matrix layer out of scope) |
| CT | 105 specs (`Combobox.ct.spec.ts` + touch; ID-less `Async loading` is the only red, React 17 only) |
| Vitest | 94 tests (ID'd case pins plus pure-helper support) |

Suites + results (micro-closer re-run, final tree state):

| Suite | Result |
| :--- | :--- |
| Vitest `Combobox.test.tsx` (workspace React 19) | 94 / 94 pass |
| CT React 19 (+ snapshots, 7 baselines unchanged) | 105 / 105 pass |
| CT React 18 (behavioral) | 105 / 105 pass |
| CT React 17 (behavioral) | 104 / 105 pass; only `Async loading` red (no case ID; Announcer-owned, see gaps) |

Title/title-count reconciliation: 94 unit + 105 CT = 199
titles; all 98 TESTS.md IDs appear in at least one title, no
`test.skip`/`fixme` anywhere, and the one red title carries no ID —
so every ID is proven by a passing suite on all three majors.

### Gaps & incoherence

- Root `value`/`onChange` are required controlled-only (landed
  2026-09-26 under the HQ no-defaultValue stance; the API freeze test pins
  the controlled contract). Sibling `defaultInputValue` / `defaultOpen`
  stay until the HQ call on sibling uncontrolled props.
- `loading`/async policy is landed (FEATURES #4: `aria-busy` on the
  nested listbox + empty/no-results through shared `announce()`, no
  private live region) and green on React 18/19, but the ID-less
  `Async loading` CT is red on React 17 only: the shared announcer
  host div renders at mount and vanishes on first interaction there.
  Proven NOT Combobox (reproduces with zero Combobox in the tree via
  `AnnouncerProbe`, and the Announcer crew's own `announces polite
  and assertive` CT fails identically on 17) and NOT the React-17
  `useId` shim (gallery serves the stabilized shim; identical
  104/105 with and without it). Owned by the Announcer/harness crew;
  no Combobox-side workaround is possible without violating the
  no-private-live-region freeze.
- The React-17 `useId` shim stabilization
  (`playwright/runtimes/react-17/hooks.ts`) was reverted to HEAD:
  contract-correct, but not required for Combobox green (full-17 CT
  is 104/105 with and without it; every Combobox consumer memoizes).
  If the Announcer crew's fix needs stable `useId` on 17, the
  6-line `useRef` patch is in the finisher report.
- Tree bridge is fully native (TR-CB-01–06): the TEMP
  `TreeBridgeHarness` / `TreeBridgeLog` / `visibleTreeBridgeItems`
  are deleted (`TreeBridgeLog` rehomed as `TreeLog`, same `tb-*`
  testids); nested-Tree stories carry no `value`/`onChange`.
  `CB-TREE-01` re-proves natively (redundant ArrowRight ENTERS the
  first enabled child with no emission; real changes emit
  `expanded:` once) and `CB-COMP-03 tree` follows the same
  log-shape change; the `Tree popup survey` ("no navigation bridge
  exists yet") is rewritten as the `Tree popup bridge` proof.
- `CB-ENV-04` is proven in-dir as a Chromium baseline only
  (`CB-ENV-04 chromium` pins the DOM/focus/callback order);
  Firefox/WebKit parity is matrix-owned.
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

Proven in-dir (`Combobox.test.tsx` Vitest + `__e2e__` CT),
98 / 98, zero `[~]` (all five former partials closed with both
halves titled: `CB-DOM-10` blur, `CB-A11Y-01` scan, `CB-EDIT-04`
self-scroll, `CB-SELECT-08` windowed, `CB-ADAPTER-*` VIRT halves):

- `[x]` `CB-DOM-01`, `CB-DOM-02`, `CB-DOM-03`, `CB-DOM-04`, `CB-DOM-05`,
  `CB-DOM-06`, `CB-DOM-07`, `CB-DOM-08`, `CB-DOM-09`, `CB-DOM-10`,
  `CB-DOM-11`, `CB-DOM-12`
- `[x]` `CB-OPEN-01`, `CB-OPEN-02`, `CB-OPEN-03`, `CB-OPEN-04`, `CB-OPEN-05`,
  `CB-OPEN-06`, `CB-OPEN-07`, `CB-OPEN-08`
- `[x]` `CB-EDIT-01`, `CB-EDIT-02`, `CB-EDIT-03`, `CB-EDIT-04`, `CB-EDIT-05`,
  `CB-EDIT-06`, `CB-EDIT-07`, `CB-EDIT-08`, `CB-EDIT-09`
- `[x]` `CB-NAV-01`, `CB-NAV-02`, `CB-NAV-03`, `CB-NAV-04`, `CB-NAV-05`,
  `CB-NAV-06`, `CB-NAV-07`, `CB-NAV-08`
- `[x]` `CB-MODE-01`, `CB-MODE-02`, `CB-MODE-03`, `CB-MODE-04`, `CB-MODE-05`,
  `CB-MODE-06`, `CB-MODE-07`, `CB-MODE-08`
- `[x]` `CB-COMMIT-01`, `CB-COMMIT-02`, `CB-COMMIT-03`, `CB-COMMIT-04`,
  `CB-COMMIT-05`, `CB-COMMIT-06`, `CB-COMMIT-07`, `CB-COMMIT-08`,
  `CB-COMMIT-09`
- `[x]` `CB-REVERT-01`, `CB-REVERT-02`, `CB-REVERT-03`, `CB-REVERT-04`,
  `CB-REVERT-05`, `CB-REVERT-06`, `CB-REVERT-07`
- `[x]` `CB-CUSTOM-01`, `CB-CUSTOM-02`
- `[x]` `CB-SELECT-01`, `CB-SELECT-02`, `CB-SELECT-03`, `CB-SELECT-04`,
  `CB-SELECT-05`, `CB-SELECT-06`, `CB-SELECT-07`, `CB-SELECT-08`
  (non-virtual + `virtualFocus` grid + windowed-Listbox Home/End/Page
  with `scrollToIndex` wait)
- `[x]` `CB-VIRT-01`, `CB-VIRT-02`, `CB-VIRT-03` (windowed-Listbox
  driver over the nested Listbox's own `virtual` prop; the former
  upward-registry block is landed)
- `[x]` `CB-TREE-01` (native registration; redundant expansion
  enters the child, real changes emit `expanded:` once)
- `[x]` `CB-ADAPTER-01`, `CB-ADAPTER-02` (+ `tree-invalid` commit
  guard), `CB-ADAPTER-03`, `CB-ADAPTER-04`, `CB-ADAPTER-05`,
  `CB-ADAPTER-06`, `CB-ADAPTER-07`, `CB-ADAPTER-08`
- `[x]` `CB-CLOSE-01`, `CB-CLOSE-02`, `CB-CLOSE-03`, `CB-CLOSE-04`,
  `CB-CLOSE-05`
- `[x]` `CB-ENV-01`, `CB-ENV-02` (17/18/19 + StrictMode), `CB-ENV-03`
  (shadow), `CB-ENV-04` (Chromium baseline in-dir; FF/WebKit are
  matrix-owned), `CB-ENV-05`
- `[x]` `CB-A11Y-01` (structural role/name/relationship assertions
  plus the automated relationship scan across shapes)
- `[x]` `CB-COMP-01` (windowed select gate), `CB-COMP-02` (list +
  both editing gate), `CB-COMP-03` (tree + grid palette gates;
  tree half native), `CB-COMP-04` (shadow + locked-overlay gate)

Cross-owned proofs (handoff cases, Combobox side): `LB-CB-01`, `LB-CB-03`
valid shape, `LB-CB-04` (+ highlight snapshot), `LB-CB-02` (windowed
via the Listbox `virtual` driver), `FI-COMP-04` commit/remove flows.

Not proven: nothing in-catalog. Out-of-catalog notes: the ID-less
`Async loading` CT (freeze async policy; red on React 17 only,
Announcer-owned) and the `displays checkmark indicator...` frozen
visual guard (no catalog ID, by design).

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
