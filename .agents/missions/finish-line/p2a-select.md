# P2A Select chain — DONE (finish-line crew report)

Listbox → Combobox → Tree, executed serially in that order with a micro-closer
for the cross-component remainders. **Listbox 73/73, Combobox 98/98, Tree
64/64** named cases proven in-dir (was 29/73, 62/97+5 partials, 55/64).
React 17/18/19 CT throughout. No commits (captain commits).

## Phase 1 — Listbox 73/73

- All 44 gap IDs closed: GROUP-01..06, MULTI-02/04/05/06/07/08,
  SINGLE-02/03/06/07, DOM-04/05/07/09/11/12, KEY-06/07, POINTER-02/03/04,
  DYNAMIC-03/04/05/06, VIRT-04/06/08/09/10, CB-01/02/04, ENV-03, A11Y-01
  (structural half; no axe scanner in repo — repo-infra note), COMP-01/02/03.
- RovingFocus rejoin verified against the landed P1.1 kernel: `getDirection` +
  `shouldIgnoreTypeaheadKey` composed; search model stays local (kernel still
  lacks the LB-KEY-04 empty-buffer cycle branch and uses `toLowerCase` repeat
  detection — swap would fork pinned behavior; documented, no fork).
- Closed both SPEC code gaps: `validateVirtualAdapter` now invoked internally
  (indexed registration + items-change effect; stale pending target dropped on
  atomic replacement), duplicate detection extended to colliding derived ids
  (render-time + commit-time).
- LB-CB-02 flipped to [x] by the micro-closer once the CB-VIRT driver existed
  (scrollToIndex(5) + deferred activedescendant, full contract CT).
- Suites: unit 12/12; CT 72/72 on 19/18/17; 8 frozen snapshots unmoved.

## Phase 2 — Combobox 98/98 (recount: catalog was 97, missing A11Y-01)

- Freeze features landed: `loading`/async (`loading` → listbox `aria-busy`,
  empty/no-results via shared `announce()`, no private live region);
  CB-VIRT-01..03 virtual driver (consults nested Listbox `virtual` for
  unmounted targets; CB-ADAPTER-08 conflict with explicit `virtualFocus`
  preserved); Tree-bridge Combobox side (below); all 5 partials closed
  (DOM-10, EDIT-04, A11Y-01 scan, SELECT-07, ENV-01).
- Suites: unit 94/94; CT 105/105 on 19/18, 104/105 on 17 — the single red is
  the ID-less `Async loading` spec, proven Announcer-owned (zero-Combobox
  repro: bare `announce()` probe loses its host div on click under React 17;
  Announcer crew's own CT fails identically). Blocks zero IDs.
- One out-of-dir edit made then REVERTED (`playwright/runtimes/react-17`
  `useId` shim): contract-correct but not required for Combobox green
  (104/105 with and without); patch preserved in crew notes for Announcer.
- CB-ENV-04: Chromium baseline in-dir; FF/WebKit parity is matrix-owned.

## Tree-bridge design (Combobox-owned contract, both sides landed)

- Combobox: `registerOption({value,id,node,textValue,disabled?,isBranch?})` →
  cleanup; `treeExpansionRequest {value,expand,seq}`; authored detection
  (sole Tree under Popover ⇒ `aria-haspopup="tree"`); RTL-aware horizontal
  delegation; leaves swallow (HQ-flagged); nested-`onChange` double-authority
  diagnostic, root sole commit authority (CB-ADAPTER-02 + tree-invalid green).
- Tree: visible items register (`isBranch` branches only), registry follows
  mount/unmount + DOM order; requests consumed by `seq` through controlled
  `expanded` exactly once; redundant expand/collapse = virtual navigation
  (enter-first-child / to-parent, TR-KEY-04/05 parity); Tree-owned
  `data-active` publication, atomic clear on collapse; `value`/`onChange`
  optional under Combobox (still throw standalone).
- TEMP `TreeBridgeHarness` deleted by the micro-closer; CB-TREE-01 +
  CB-COMP-03-tree re-proven natively; `Tree popup survey` rewritten as the
  `Tree popup bridge` proof.

## Phase 3 — Tree 64/64

- TR-CB-01..06 + TR-COMP-03 proven against the live Combobox; TR-DYNAMIC-01/02
  re-targeted `[unit]`→`[browser]` (maintainer-take, flagged: a parallel pure
  model the DOM-traversal engine doesn't use would be theater again; behaviors
  proven end-to-end via `DynamicHierarchy`).
- FEATURES #3 (Slot sniffing, VERIFY-BLOCKED) and #4 (shared RovingFocus)
  untouched as briefed.
- Suites: unit 7/7; CT 67/67 on 19/18/17; 15 baselines unmoved.

## Suites + results (final tree state)

| Suite | Result |
|---|---|
| Listbox unit / CT 19/18/17 | 12/12, 72/72 each |
| Combobox unit / CT 19/18/17 | 94/94, 105/105, 105/105, 104/105* |
| Tree unit / CT 19/18/17 | 7/7, 67/67 each |
| tsc (touched files, each phase) | clean |
| Captain unit smoke (final state) | 12 + 94 + 7 green |

\* ID-less `Async loading` on 17 only — Announcer-owned, zero IDs blocked.

## Files (20, all inside the three components; no neighbor edits)

Listbox: `Listbox.tsx`, `Listbox.story.tsx`, `Listbox.ct.spec.ts`, SPEC,
FEATURES, PATCHES. Combobox: `Combobox.tsx`, `combobox-context.ts`,
`authored.ts`, story, unit, both CT specs, SPEC. Tree: `Tree.tsx`, story,
CT spec, SPEC, TESTS (DYNAMIC tags), FEATURES (#1 LANDED).

## Remaining / owned elsewhere

- React-17 `Async loading` red → Announcer/harness crew (evidence in report;
  preserved `useId` patch may help their fix).
- CB-ENV-04 FF/WebKit + any `browser:all` engine halves → matrix layer.
- LB-A11Y-01 scanner half → repo-level axe infra (none configured).
- Tree `defaultExpanded`, FEATURES #3/#4 → later gates / HQ calls as documented.
