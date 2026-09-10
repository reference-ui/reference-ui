# RovingFocus SPEC

Current freeze, cases, and proof. Design narrative: [RovingFocus.md](./RovingFocus.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/roving-focus.spec.ts`
Unit: `matrix/lib/tests/unit/roving-focus.test.ts` (missing)
Page: `/roving-focus`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** This is the composite keyboard kernel
for Listbox, Menu, Tabs, and Tree. Accordion is a **negative** composition:
headers stay native Tab stops.

Visual polish is not this gate. Do not add a selection store or
`aria-activedescendant` (Combobox owns virtual focus).

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Transparent Root + Item; `ReferenceSlotPartProps`; Item slots `tabIndex` |
| Props | `orientation?`, `loop?`, `typeahead?`; Item `disabled?`, `textValue?` |
| Defaults | horizontal, no loop, typeahead off |
| Grid | `orientation="both"` uses **visual** row/column geometry |
| Typeahead | optional; 1000ms idle; Unicode; capture-phase Space |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. 1D arrows + ASCII typeahead smoke. |
| Production | **No.** |
| Named `[x]` | 7 / 55 |
| Playwright | 5 |
| Vitest | 0 |

### Gaps & incoherence

- Extra public surface: `currentId` / `defaultCurrentId` /
  `onCurrentIdChange`. Freeze has no controlled current-id API.
- Root is a Provider wrapper, not a transparent slot onto one composite
  child (`ReferenceSlotPartProps`).
- `orientation="both"` is 1D with both arrow axes, not measured visual grid
  (`RF-GRID-*`).
- Typeahead is ASCII `startsWith`. Missing 1000ms idle, Unicode, capture
  Space.
- Tabs currently reinvents arrows instead of composing this kernel.

### Vendor

**Lift:** Radix `packages/react/roving-focus`; Aria `useTypeSelect` +
`ListKeyboardDelegate`; Ariakit composite / typeahead (2D, Unicode).

**Leave:** selection stores; Headless 350ms typeahead timing; Toolbar as a
primitive.

### Case index

- `[x]` `RF-TAB-01`, `RF-TAB-02`, `RF-KEY-01`, `RF-KEY-04`, `RF-KEY-06`,
  `RF-KEY-07`, `RF-TYPE-02`, `RF-TYPE-03`
- `[ ]` `RF-API-01`, remaining `RF-DOM-*` / `RF-TAB-*` / `RF-KEY-*`, all
  `RF-GRID-*`, remaining `RF-TYPE-*`, `RF-NEST-*`, `RF-ENV-*`, `RF-COMP-*`

### Work order

1. Strip `currentId` / uncontrolled current to match freeze (or amend freeze
   with a named reason — default is strip).
2. Slot Root/Item onto one child (`ReferenceSlotPartProps`).
3. Visual-grid `both` + RTL (`RF-GRID-*`).
4. Typeahead unit `RF-TYPE-02`–`08` (idle, Unicode, Space).
5. Tabs/Listbox/Menu/Tree consume this kernel; do not fork arrows.

### Won't do

Virtual focus. Accordion headers as a roving set. Visual chrome.

### Done when

Public API matches RovingFocus.md. Every TESTS.md ID is `[x]` here.
Listbox/Menu/Tabs/Tree do not ship a second arrow engine.
