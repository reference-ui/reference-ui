# Tree SPEC

Current freeze, cases, and proof. Design narrative: [Tree.md](./Tree.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/tree.spec.ts`
Page: `/tree`

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

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. Expand/select + some keyboard. |
| Production | **No.** |
| Named `[x]` | 3 / 64 |
| Playwright | 3 |
| Vitest | 0 |

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

- `[x]` `TR-DOM-01`, `TR-KEY-01`, `TR-KEY-02`
- `[ ]` remaining `TR-DOM-*` / `TR-KEY-*`, `TR-SELECT-*`, `TR-EXPAND-*`,
  `TR-TYPE-*`, `TR-DYNAMIC-*`, `TR-CB-*`, `TR-ENV-*`, `TR-A11Y-01`,
  `TR-COMP-*`

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
