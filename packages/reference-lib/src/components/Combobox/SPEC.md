# Combobox SPEC

Current freeze, cases, and proof. Design narrative: [Combobox.md](./Combobox.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/combobox.spec.ts`
Colocated: `Combobox.test.tsx` (5 tests; **no case IDs**)
Page: `/combobox`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

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
| Commit | root `onChange` is the sole commit |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. Opens on focus; Listbox click commit. |
| Production | **No.** |
| Named `[x]` | 1 / 97 (`CB-DOM-01`) |
| Playwright | 2 (`CB-DOM-02` is visual chrome, not catalog behavior) |
| Vitest | 5 tests, 0 IDs |

### Gaps & incoherence

- `defaultValue` / `defaultOpen` / uncontrolled open+value.
- Prop drift: `onOpenChange` vs freeze `onOpen` / `onDismiss`.
- No `autocomplete` matrix, `allowCustomValue`, `closeOnBlur`,
  `VirtualItem`, Tree bridge.
- Focus opens the popup — fights deliberate open / closeOnBlur.
- No async contract: `loading?` → `aria-busy` on the listbox and an empty /
  "no results" string routed through `announce()`, not a private live region.
- `CB-DOM-02` is a visual checkmark/ring title, not a catalog case.

### Vendor

**Lift:** `vendor/downshift/src/hooks` (`useCombobox`, `useSelect`);
`vendor/react-spectrum/packages/@react-aria/combobox`;
`vendor/zag/packages/machines/combobox` (mode matrix);
`vendor/base-ui/packages/react/src/combobox`.

**Leave:** cmdk score/filter; Zag positioning/dismiss runtime; Downshift
render props; Base UI / Zag `multiple` (`selectionMode`) token-chip combobox
— single-value freeze; multi belongs to a later gate, not this kernel.

### Case index

- `[x]` `CB-DOM-01`
- `[ ]` remaining `CB-DOM-*`, `CB-OPEN-*`, `CB-EDIT-*`, `CB-NAV-*`,
  `CB-MODE-*`, `CB-COMMIT-*`, `CB-REVERT-*`, `CB-CUSTOM-*`, `CB-SELECT-*`,
  `CB-VIRT-*`, `CB-TREE-01`, `CB-ADAPTER-*`, `CB-CLOSE-*`, `CB-ENV-*`,
  `CB-A11Y-01`, `CB-COMP-*`

Not catalog: `CB-DOM-02` visual. Drop or rehome.

### Work order

1. Controlled-only `open` / `value` / `inputValue`; freeze callback names.
2. Focus-in-field + activedescendant over Listbox (Listbox first).
3. Commit / Escape revert + blur policy.
4. Select-only Trigger.
5. `autocomplete` none/list/both.
6. `loading` → `aria-busy` + `announce()` empty/no-results messaging.
7. `virtualFocus` + Tree; then ID’d e2e.

### Won't do

Filtering/ranking. CommandPalette product. Overlay kernel rewrite.
**Multiple selection / token chips** (single-value freeze; revisit as a
named later gate, not a silent omission).

### Done when

Public API matches Combobox.md. Every TESTS.md ID is `[x]` here. Overlay
catalogs stay on Overlay.
