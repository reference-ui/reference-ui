# Red-team compounding log: Menubar

Target: `packages/reference-lib/src/components/Menubar`. One Hypothesis +
one Verdict per hunt. Consult before hunting; never re-prove explored gaps.

---

## Hunt 1 (2026-09-27) — stale entry intent leaks across menus — BREAK-FOUND

### Hypothesis

Gap pursued: `pendingMenuEntry` (`Menu.tsx`) is a module-global singleton
with no owner, shared by every Menu root on the page. `useMenuTriggerKeys`
records intent on EVERY Up/Down/Enter/Space press — even when the menu is
already open and no open transition will consume it. A menubar switch
(trigger/content arrows) sets no intent of its own, so the newly opened
menu consumes the dead keypress's intent.

Red test written: `/tmp/menubar-red/menubar-t1.red.test.tsx` (3 probes:
trigger-arrow switch, content-arrow switch, programmatic open — all after
Up-on-an-open-trigger plants stale `'last'`), config
`/tmp/menubar-red/vitest.red.config.ts`, run via repo runner:
`pnpm agent vt -c /tmp/menubar-red/vitest.red.config.ts`.

Setup locked: the Up press emits nothing (`seen == ['file']`, open menu
unchanged — the dedup holds); the switch emits exactly `['file','edit']`
with correct mount/unmount. Only the focus landing is wrong.

### Verdict

**break-found.** All 3 probes land focus on `#red-edit-redo` (the LAST
item) instead of the SPEC-pinned switch landing.

Violated contract: `Menubar/SPEC.md` adaptation — "MB-KEY-03/MB-KEY-06
land focus inside the newly opened menu (container or first item via Menu
entry effects)". Also contradicts `Menu/Menu.md` ("the opening key is
consumed once per open" — here a NON-opening key's intent is consumed by
an unrelated later open, including a programmatic open with zero gesture).

Kill chain: Up on open trigger → `setMenuEntryIntent('last')`
unconditional + `setIsOpen(true)` → Popover `onOpenChange(true)` (fired
unconditionally) → Menubar `requestValue` dedups → no transition, intent
lingers → switch/programmatic open → new Menu consumes `'last'` once per
open → rAF focuses last enabled item.

Repro path: `/tmp/menubar-red/` (test + config + blind-run command above).
No tree writes; branch `reference-system` untouched.

### Map for future hunters (ruled OUT this hunt — do not re-spend)

- Trigger/content arrows anchor on the focused trigger / own menu value;
  RovingFocus arrows anchor on the event-source item id (not stale
  `currentId`) — focus and value can not diverge through the row.
- `getDirection` uses computed style (inherits), so ancestor-`dir` RTL
  agrees between RovingFocus (item node) and Menubar (bar root). RTL story
  already covers the ancestor case.
- Esc: Menu prevents + stops propagation (level-local close); Overlay's
  document Esc listener only fires when nothing prevented it (e.g. Esc on
  a trigger with menu open closes via dismiss). No double-close path for
  the bar to add.
- Unknown-anchor (disabled-while-open) nav landing on the edge is
  specified in `menubar-nav.ts` + MB-NAV-01 — floor, not a gap.
- Pointer opens always clear intent (`keys.onClick` runs sync before the
  batched open commit), so pointer paths can not consume stale intent.
- Duplicate values (warn-only, both open), Tab continuation, typeahead,
  React 17/18 refs: specified follow-ups / misuse — floor.
