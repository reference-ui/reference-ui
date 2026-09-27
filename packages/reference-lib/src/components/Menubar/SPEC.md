# Menubar SPEC

Current freeze, cases, and proof. Case catalog: [TESTS.md](./TESTS.md).

CT: `__e2e__/Menubar.ct.spec.ts` (React 19)
Colocated: `Menubar.test.tsx` + `menubar-nav.test.ts`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Controlled-only `value`/`onValueChange`
coordination across Menu roots (no `defaultValue`; Menubar has no
optional-value exception). Roving and layers are RovingFocus's and
Overlay's. Everything inside one menu is Menu's.

Visual polish is not this gate. Do not add public `Sub*` parts. Do not
rebuild Menu dismissal, and do not touch `../Menu` (read-only, other arcs).

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | `Menubar` root, `Menubar.Menu` (`value?`), `Menubar.Trigger`, `Menubar.Content` (auto-wraps one Menu root; items are `Menu.*`) |
| Value | Controlled-only: required `value` + `onValueChange`, `string \| null`, null = none, no `defaultValue`; open-one-closes-others by construction |
| Triggers | `button[role=menuitem]`, `aria-haspopup=menu`, ghost variant, horizontal roving, `loop` (default false) |
| Arrows | triggers: focus always + switch while open; content root level: switch; submenu parent open-arrow: Menu-owned; nested: Menu-owned |
| Escape | none of Menubar's own — Menu closes one level per press with focus return (APG; rejects "Esc closes all") |

### Status (2026-09-27 wants-menubar crew)

| | |
| :--- | :--- |
| Engine | Root value state + per-menu controlled Popover + shared `menubar-nav` move resolution. |
| Production | **New.** Coordination seam only; menu internals ride Menu unchanged. |
| Named `[x]` | 28 / 28 (CT 22 + unit 8 facets; `MB-DOM-03`/`MB-OPEN-04` proven in both) |
| CT | 23 (React 19 green, 4 settled snapshots) |
| Vitest | 17 (`Menubar.test.tsx` 9 + `menubar-nav.test.ts` 8) |

### Case index

Proven by passing CT/unit titles:

- `[x]` `MB-DOM-01` `MB-DOM-02` `MB-DOM-03` `MB-DOM-04` `MB-DOM-05`
- `[x]` `MB-OPEN-01` `MB-OPEN-02` `MB-OPEN-03` `MB-OPEN-04` `MB-OPEN-05` `MB-OPEN-06`
- `[x]` `MB-KEY-01` `MB-KEY-02` `MB-KEY-03` `MB-KEY-04` `MB-KEY-05` `MB-KEY-06` `MB-KEY-07` `MB-KEY-08` `MB-KEY-09`
- `[x]` `MB-ESC-01` `MB-ESC-02`
- `[x]` `MB-FOCUS-01`
- `[x]` `MB-ENV-01` `MB-ENV-02` `MB-NAV-01` `MB-RTL-01` `MB-A11Y-01`

Adaptations (pinned current behavior where sources conflict):

- `MB-KEY-01` keeps Up-opens-last from Menu entry wiring; Radix menubar has
  no trigger-Up behavior, but the bar composes Menu triggers and Menu
  consistency wins over Radix-table literalism.
- `MB-KEY-03`/`MB-KEY-06` land focus inside the newly opened menu (container
  or first item via Menu entry effects), not on the newly focused trigger.
  This is the APG-permitted alternative ("opens the submenu … and places
  focus on the first item"), matching pointer-open focus.
- Tab rides Menu (closes, trigger-relative continuation) and can land on an
  adjacent collapsed trigger instead of leaving the bar. APG wants Tab out
  of the menubar; overriding Menu's Tab from the bar is follow-up work, not
  this freeze — close-all holds either way.
- Consumer `ref`s resolve on React 19 only (plain-function
  `Popover.Trigger`/`Popover.Content` chains drop `props.ref` on 17/18 —
  same handoff class as Menu; trigger arrows also depend on the
  RovingFocus item ref, so 17/18 bars keep clicks but lose arrow travel).

### Work order

1. Root value state + Menu/Trigger/Content parts (this change).
2. ID'd cases.
3. Follow-ups (not this freeze): hover-to-switch while open, trigger-row
   typeahead (APG-optional), Tab-out-of-bar override, React 17/18 ref
   fallbacks.

### Vendor

**Lift:** Radix menubar (`value`, `Menu`/`Trigger`/`Content`, Left/Right
switch table, Esc-to-trigger); APG menu-and-menubar keyboard (one-level
Esc, cross-menu arrows, Tab closes all).

**Leave:** public `Sub*` (nested submenus are `Menu`'s); Radix/Ark menu
runtimes; NavigationMenu mega-menu.

### Won't do

Visual polish. Hover intent. A second overlay runtime. Menu behavior
changes (read-only dir).

### Done when

Public API matches this SPEC. Every TESTS.md ID is `[x]` here.
