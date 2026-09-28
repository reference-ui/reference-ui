# Tree SPEC

Current freeze, cases, and proof. Design narrative: [Tree.md](./Tree.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `__e2e__/Tree.ct.spec.ts` (colocated CT; quarantine matrix cases re-targeted here)
Vitest: `Tree.test.tsx` (colocated)
Page: `/tree` (quarantine matrix fixture; CT mounts `Tree.story.tsx` Parity)

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Minimal APG tree: visible-only
roving, single select, typeahead. Combobox may use it as a nested popup.

Visual polish is not this gate. No multi-select, no virtualization, no
file-explorer scope.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Host | `div[role=tree]`; Item `treeitem`; Group `group`; Expander `button[tabindex=-1]` |
| ARIA | `aria-level` per depth; `aria-expanded` on parent items; `aria-selected` on the selected item; `aria-setsize`/`aria-posinset` only when a level is partially rendered |
| State | controlled `value` / `onChange`, `expanded` / `onExpandedChange`; omit → `null` / `[]` |
| Keys | APG arrows + RTL; expander pointer ≠ select |
| Combobox | expose visible registry; Combobox owns commit; `data-active` preview |

### Status (2026-09-28 finish-line)

| | |
| :--- | :--- |
| Engine | Hardened APG tree + native Combobox bridge. |
| Production | **No** — uncontrolled `defaultExpanded` preserved; FEATURES #3 (Slot sniffing, VERIFY-BLOCKED) and #4 (shared RovingFocus) still open. |
| Named `[x]` | 64 / 64 |
| Playwright | 62 |
| Vitest | 3 |

Bonus IDs proven in passing titles but outside the 64-case catalog:
`TR-KEY-12`, `TR-KEY-13`, `TR-CSS-01` (CT), `TR-API-01`, `TR-API-02`
(CT + unit).

### Landing note (quarantine-landing, 2026-09-25)

Quarantine ported as **tests + hardening only**. Visuals frozen: all 15
snapshot baselines unmodified and green. Deliberate divergences from the
freeze catalog above, per recon:

- Uncontrolled mode (`defaultValue` / `defaultExpanded` + internal store)
  is **preserved**, not removed (recon exhibit 1). Freeze work-order
  item 1 is superseded. (Superseded 2026-09-26 for selection: HQ
  controlled-only rule deleted `defaultValue`; `defaultExpanded` kept
  pending the HQ call on sibling default props.)
- `TR-DOM-10` is re-targeted: pins uncontrolled omission (expands and
  selects through internal state) plus controlled-without-callbacks
  staying put, instead of the controlled-only omission freeze.
  (Re-targeted again 2026-09-26: selection is state-driven, omission of
  `value`/`onChange` fails fast, and callback-less frozen trees are gone.)
- `TR-EXPAND-06` is proven twice: browser payload order plus a unit test
  of the exported `getDeterministicExpanded`.
- Branch auto-detection (Group-authored items are branches without an
  explicit `isBranch` prop) is implemented as a render-time children
  scan, not quarantine's registration state — with our two-path
  branch/leaf DOM, registration state would mismatch SSR hydration.
- `data-active` keeps its current focus semantics. Quarantine's
  combobox-active semantics were not ported with the skipped bridge.
- Typeahead label extraction carves ASCII digits out of the decorative
  strip (`\p{Emoji}` matches 0-9): "0 backups" searches as "0 backups",
  not "backups". Quarantine's fixture had no digit-leading labels, so
  the digit-eating was latent there; the Parity zero-item exposed it.
- Not ported: `TR-DYNAMIC-01`, `TR-DYNAMIC-02` (the hierarchy model is
  unreferenced by quarantine's own component — test theater; dynamics
  proven via browser `TR-DYNAMIC-03`–`06`), `TR-CB-01`–`06` +
  `TR-COMP-03` (Combobox bridge: new cross-component feature, Combobox
  territory per TESTS.md "Owned elsewhere"), `TR-ENV-03` (shadow-portal
  key events hit React container-delegation retargeting — lib-wide
  framework concern, not Tree stability; same skip as Switch
  `SW-ENV-03`).
- Source hardening (no visual change): Item/Group/Expander forward refs;
  auto branch detection; `aria-posinset`/`aria-setsize`; duplicate
  identity throws; idempotent selection; Expander disabled guard;
  focus recovery on removal; deterministic expansion payloads; RTL via
  `closest('[dir]')`; modified-key guard; shared RovingFocus
  `TypeaheadModel` + Space-buffer rule; Group ids + Expander
  `aria-controls` with `aria-hidden` removed; `CSS.escape` hardening.

### Finish-line note (P2A phase 3, 2026-09-28)

All 9 remaining IDs proven in-dir (CT against the live Combobox, React
17/18/19; no snapshot changes — the bridge is behavior-only):

- `TR-CB-01`–`06` + `TR-COMP-03`: native bridge landed in `Tree.tsx`.
  Visible enabled items register with `isBranch` for branches (leaves
  omit); the registry follows expand/collapse/reorder by mount/unmount
  plus live DOM order. `treeExpansionRequest` is consumed by `seq` and
  routed through controlled `expanded` / `onExpandedChange` exactly
  once; leaf/unknown values are ignored. Redundant requests are virtual
  navigation, never emissions: expand-on-expanded enters the first
  enabled child, collapse-on-collapsed moves to the parent (TR-KEY-04/05
  parity — the deleted CB-TREE-01 harness had encoded stays-put
  instead). `data-active`
  previews the source's virtual focus under Combobox (standalone keeps
  roving focus). Activation commits only through root `onChange`; a
  nested Tree `onChange` diagnoses (render-time, both sides) and is never
  invoked. `value` / `onChange` are optional under Combobox (selection
  display falls back to `combobox.value`) and still throw standalone.
- `TR-DYNAMIC-01`/`02`: re-targeted `[unit]` → `[browser]` (TESTS.md tags
  updated). The landing note called the hierarchy model unreferenced test
  theater: the shipped engine traverses live DOM queries (SPEC gaps,
  FEATURES #4 defers the shared-engine swap), so a parallel pure model
  the component does not use would be theater again. The behaviors the
  cases pin — metadata/traversal recompute after insert/remove/reorder
  (root, nested, empty, single-branch) and identity-preserving
  cross-parent branch moves — are instead proven end-to-end through the
  real component in CT (`DynamicHierarchy` story).
- Combobox collateral (harness-deletion micro-task, DONE 2026-09-28):
  `TreeBridgeHarness` deleted, `CB-TREE-01` + `CB-COMP-03 tree`
  re-proven natively, `Tree popup survey` rewritten as the `Tree popup
  bridge` proof. Combobox unit 94/94 + CT 105/105 (19/18) and 104/105
  (17, ID-less Announcer-owned red only).

### Gaps & incoherence

- `defaultExpanded` uncontrolled (selection went controlled-only
  2026-09-26: `value` + `onChange` required standalone, `defaultValue`
  deleted; both optional under Combobox since the 2026-09-28 bridge).
- `React.Children.forEach` sniffs Group vs row — not Slot / part
  registration.
- Roving via DOM queries, not shared RovingFocus.
- No `aria-level` / `aria-expanded` / `aria-selected` contract in the freeze
  surface — APG level semantics were implied, now explicit.

### Vendor

**Lift:** `vendor/zag/packages/machines/tree-view` (`visibleNodes` +
`aria-level` per depth in `tree-view.connect.ts`). Aria collection filter as
**contrast only**.

**Leave:** Aria `useTree` treegrid; multi/virtual; DnD.

### Case index

- `[x]` `TR-DOM-01`, `TR-DOM-02`, `TR-DOM-03`, `TR-DOM-04`, `TR-DOM-05`,
  `TR-DOM-06`, `TR-DOM-07`, `TR-DOM-08`, `TR-DOM-09`, `TR-DOM-10`
  (re-targeted, see Landing note), `TR-DOM-11`, `TR-DOM-12`
- `[x]` `TR-SELECT-01`, `TR-SELECT-02`, `TR-SELECT-03`, `TR-SELECT-04`,
  `TR-SELECT-05`, `TR-SELECT-06`, `TR-SELECT-07`, `TR-SELECT-08`
- `[x]` `TR-EXPAND-01`, `TR-EXPAND-02`, `TR-EXPAND-03`, `TR-EXPAND-04`,
  `TR-EXPAND-05`, `TR-EXPAND-06` (CT + unit), `TR-EXPAND-07`,
  `TR-EXPAND-08`, `TR-EXPAND-09`
- `[x]` `TR-KEY-01`, `TR-KEY-02`, `TR-KEY-03`, `TR-KEY-04`, `TR-KEY-05`,
  `TR-KEY-06`, `TR-KEY-07`, `TR-KEY-08`, `TR-KEY-09`, `TR-KEY-10`,
  `TR-KEY-11`
- `[x]` `TR-TYPE-01`, `TR-TYPE-02`, `TR-TYPE-03`, `TR-TYPE-04`,
  `TR-TYPE-05`
- `[x]` `TR-DYNAMIC-01`, `TR-DYNAMIC-02` (re-targeted
  `[unit]` → `[browser]`, see Finish-line note), `TR-DYNAMIC-03`,
  `TR-DYNAMIC-04`, `TR-DYNAMIC-05`, `TR-DYNAMIC-06`
- `[x]` `TR-ENV-01`, `TR-ENV-02` (unit), `TR-ENV-03` (CT, shadow)
- `[x]` `TR-A11Y-01`
- `[x]` `TR-COMP-01`, `TR-COMP-02`, `TR-COMP-03`
- `[x]` `TR-CB-01`, `TR-CB-02`, `TR-CB-03`, `TR-CB-04` (CT + invalid),
  `TR-CB-05`, `TR-CB-06`
- `[x]` bonus (outside the 64 catalog): `TR-KEY-12`, `TR-KEY-13`,
  `TR-CSS-01`, `TR-API-01`, `TR-API-02`

### Work order

1. Controlled-only `value` / `expanded`.
2. Visible-set roving + Expander pointer ≠ select; emit `aria-level` /
   `aria-expanded` / `aria-selected`.
3. RTL expand keys.
4. Typeahead on the visible set.
5. Combobox registry (`TR-CB-*`).
6. Replace child sniffing with part registration (Slot).

### Won't do

Multi-select. Virtualized tree. Explorer DnD. Visual polish.

### Done when

Public API matches Tree.md. Every TESTS.md ID is `[x]` here.
