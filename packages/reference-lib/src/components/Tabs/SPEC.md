# Tabs SPEC

Current freeze, cases, and proof. Design narrative: [Tabs.md](./Tabs.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/tabs.spec.ts`
Colocated: `Tabs.test.tsx` (visual; no case IDs)
Page: `/tabs`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Required controlled `value`. Movement
is RovingFocus (typeahead off). Tabs owns activation policy only.

Visual polish is not this gate. No `variant`, no `defaultValue`.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Transparent root; List / Tab / Panel fixed hosts + roles |
| State | required `value`; `orientation?`; `activation?` (horizontal / automatic) |
| ARIA | `aria-controls` only on the selected Tab |
| Panels | all stay mounted; inactive use native `hidden` |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. Does not compose RovingFocus. |
| Production | **No.** |
| Named `[x]` | 3 / 49 |
| Playwright | 1 |
| Vitest | 0 contract IDs (2 visual tests) |

### Gaps & incoherence

- `defaultValue`, `variant` (`line` / `pill`), root `disabled` — not in freeze.
- Reinvents arrows on List. Freeze: RovingFocus.
- `tabIndex={isSelected ? 0 : -1}` ties the tab stop to selection — breaks
  manual activation (`TB-MANUAL-*`).
- Hardcoded line/pill chrome in List/Tab.

### Vendor

**Lift:** Aria Tabs tests + `useTab` selected-only `aria-controls`; Radix
activation / focus-blur regressions.

**Leave:** deselectable / nullable value.

### Case index

- `[x]` `TB-DOM-01`, `TB-DOM-03`, `TB-DOM-04`
- `[ ]` remaining `TB-DOM-*`, `TB-SELECT-*`, `TB-AUTO-*`, `TB-MANUAL-*`,
  `TB-EVENT-*`, `TB-DYNAMIC-*`, `TB-NEST-*`, `TB-ENV-*`, `TB-A11Y-01`,
  `TB-COMP-*`

### Work order

1. Require controlled `value`; remove `defaultValue` / `variant` from the
   public API (visuals stay in Book, not the kernel).
2. Compose RovingFocus; Tabs owns automatic vs manual only.
3. Manual mode: focus can leave the selected tab stop.
4. Port SELECT / AUTO / MANUAL / EVENT with real IDs.

### Won't do

Indicator / panel transitions as kernel. Provider API. Overlay in panels.

### Done when

Public API matches Tabs.md. Every TESTS.md ID is `[x]` here. Arrows come
from RovingFocus.
