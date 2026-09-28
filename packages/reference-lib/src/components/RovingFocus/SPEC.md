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

### Status (2026-09-28 finish-line P1.1)

| | |
| :--- | :--- |
| Engine | Production kernel: 1D + visual grid, Unicode typeahead, slot merge. |
| Production | **Yes.** 53 / 55 named cases proven on React 17/18/19. |
| Named `[x]` | 53 / 55 (`RF-ENV-02` CUT, `RF-ENV-03` rides matrix engines) |
| Playwright CT | 44 (React 17/18/19; snapshots on 19) |
| Vitest | 50 (typeahead model, grid geometry, slot merge, SSR, API types) |

### Gaps & incoherence

- ~~Extra public surface: `currentId` / `defaultCurrentId` /
  `onCurrentIdChange`. Freeze has no controlled current-id API.~~ STRIPPED
  2026-09-26 (FEATURES #5): currentness is internal-only; zero in-repo
  consumers used the controlled props.
- ~~Root is a Provider wrapper, not a transparent slot onto one composite
  child (`ReferenceSlotPartProps`).~~ LANDED 2026-09-28 (FEATURES #2):
  Root/Item extend the slot surface, merge className/style/handlers/ref/
  `aria-describedby`/`css` onto the one child per the merge rules, throw on
  anything else (RF-DOM-06). Remainder: direct token props (e.g.
  `padding="4"`) on the parts forward to the child uncompiled until the
  shared Slot helper owns the split — reference-primitive children compile
  them downstream; the `css` prop compiles today.
- ~~`orientation="both"` is 1D with both arrow axes, not measured visual grid
  (`RF-GRID-*`).~~ LANDED 2026-09-28 (FEATURES #1): `grid.ts` groups rows by
  vertical overlap from per-keystroke rects, horizontal moves follow visual
  x order, vertical moves take the adjacent row's nearest center with
  DOM-order ties, disabled rows keep geometry (stay), loop wraps in
  geometry, RTL falls out of the layout, Home/End/PageUp/PageDown stay
  whole-composite.
- ~~Typeahead is ASCII `startsWith`. Missing 1000ms idle, Unicode, capture
  Space.~~ LANDED (model 2026-09-10…26, browser pins 2026-09-28):
  `TypeaheadModel` (1000ms idle, same-letter cycle, `Intl.Collator`
  Unicode, skip-unavailable) + guards (`shouldIgnoreTypeaheadKey`) +
  bubble-`preventDefault` Space handling pinned by CT (PATCHES #1, no
  capture remainder).
- Tabs currently reinvents arrows instead of composing this kernel.
  → Consumer migration is FEATURES #7, owned by the Tabs/Listbox/Tree
  crews; the kernel API is frozen and this unblock is fired.

### Vendor

**Lift:** Radix `packages/react/roving-focus`; Aria `useTypeSelect` +
`ListKeyboardDelegate`; Ariakit composite / typeahead (2D, Unicode).

**Leave:** selection stores; Headless 350ms typeahead timing; Toolbar as a
primitive.

### Case index

- `[x]` `RF-API-01` (types), `RF-DOM-01`–`06`, `RF-TAB-01`–`08`,
  `RF-KEY-01`–`12`, `RF-GRID-01`–`08`, `RF-TYPE-01`–`12`, `RF-NEST-01/02`,
  `RF-ENV-01`, `RF-COMP-01`–`03` — every ID appears in a passing colocated
  Vitest or CT title on React 17/18/19 (2026-09-28 finish-line P1.1;
  earlier passes noted below).
- `[ ]` `RF-ENV-03` — Chromium proven here; Firefox/WebKit parity rides the
  matrix engine layer (`pnpm agent`), not CT.
- `RF-ENV-02` CUT 2026-09-26 (FEATURES #6 — shadow out of scope, see TESTS.md).
- History: 7/55 at 2026-09-10 (`RF-TAB-01/02`, `RF-KEY-01/04/06/07`,
  `RF-TYPE-02/03/06`); `RF-DOM-06` + `RF-TAB-04` + typeahead model units
  2026-09-26 (FEATURES/PATCHES pass; bubble preventDefault already cancels
  Space activation — no capture remainder, see PATCHES.md #1).

### Work order

1. ~~Strip `currentId` / uncontrolled current to match freeze (or amend freeze
   with a named reason — default is strip).~~ DONE 2026-09-26 (stripped,
   FEATURES #5).
2. ~~Slot Root/Item onto one child (`ReferenceSlotPartProps`).~~ DONE
   2026-09-28 (FEATURES #2; direct-token-prop compilation stays with the
   future shared Slot helper).
3. ~~Visual-grid `both` + RTL (`RF-GRID-*`).~~ DONE 2026-09-28 (FEATURES #1).
4. ~~Typeahead unit `RF-TYPE-02`–`08` (idle, Unicode, Space).~~ DONE
   (model 2026-09-26, browser pins 2026-09-28).
5. Tabs/Listbox/Menu/Tree consume this kernel; do not fork arrows.
   → OPEN, owned by consumer crews (FEATURES #7).

### Won't do

Virtual focus. Accordion headers as a roving set. Visual chrome.

### Done when

Public API matches RovingFocus.md. Every TESTS.md ID is `[x]` here.
Listbox/Menu/Tabs/Tree do not ship a second arrow engine.
