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

### Status (2026-09-25 landing)

| | |
| :--- | :--- |
| Engine | Hardened APG tree (landing). |
| Production | **No** — see Landing note (uncontrolled preserved; CB/model cases open). |
| Named `[x]` | 54 / 64 |
| Playwright | 52 |
| Vitest | 3 |

### Landing note (quarantine-landing, 2026-09-25)

Quarantine ported as **tests + hardening only**. Visuals frozen: all 15
snapshot baselines unmodified and green. Deliberate divergences from the
freeze catalog above, per recon:

- Uncontrolled mode (`defaultValue` / `defaultExpanded` + internal store)
  is **preserved**, not removed (recon exhibit 1). Freeze work-order
  item 1 is superseded.
- `TR-DOM-10` is re-targeted: pins uncontrolled omission (expands and
  selects through internal state) plus controlled-without-callbacks
  staying put, instead of the controlled-only omission freeze.
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

### Gaps & incoherence

- `defaultValue` / `defaultExpanded` uncontrolled.
- `React.Children.forEach` sniffs Group vs row — not Slot / part
  registration.
- Roving via DOM queries, not shared RovingFocus.
- No `aria-level` / `aria-expanded` / `aria-selected` contract in the freeze
  surface — APG level semantics were implied, now explicit.
- Combobox bridge / `data-active` preview incomplete.

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
- `[x]` `TR-DYNAMIC-03`, `TR-DYNAMIC-04`, `TR-DYNAMIC-05`,
  `TR-DYNAMIC-06`
- `[x]` `TR-ENV-01`, `TR-ENV-02` (unit)
- `[x]` `TR-A11Y-01`
- `[x]` `TR-COMP-01`, `TR-COMP-02`
- `[ ]` `TR-DYNAMIC-01`, `TR-DYNAMIC-02`, `TR-CB-01`, `TR-CB-02`,
  `TR-CB-03`, `TR-CB-04`, `TR-CB-05`, `TR-CB-06`, `TR-ENV-03`,
  `TR-COMP-03` (not ported, see Landing note)

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
