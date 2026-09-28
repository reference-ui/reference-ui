# P1.2 — Portal/Overlay seam (finish-line)

Crew: finish-line seam. No commits (captain commits). Scope held to
Portal + Overlay (+ their tests/docs); zero neighbor edits.

## Done

**Portal joint (SPEC ledger + late-resolve/SSR + shadow ownership)**
- `Portal/SPEC.md` (new): honest ledger, 17/25 `[x]` (CT + unit
  titles). 8 `[ ]` rows are unpinned coverage, not behavior gaps.
- Late-resolve, Portal side: unit pin `PT-CONTAINER-03` (resolver
  null-then-target, no transient body copy) joins CT
  `PT-CONTAINER-02`; `PT-CONTAINER-06` pinned via the extended
  `PT-REACT-05` unit title (same test asserts both).
- SSR, Portal side: unit pins `PT-ENV-01` (server emits nothing) and
  `PT-ENV-02` (hydrate + one body child, no mismatch warning).
  No `Portal.tsx` change needed — paths already behave.
- Shadow-ownership call (SPEC Joints): Portal owns placement +
  delivery (`PT-DOM-05/ENV-03/COMP-03/SHADOW-01`, ancestor
  double-dispatch documented not suppressed); Overlay owns the
  automatic destination rule; Menu/Combobox own composed-path usage +
  owning-root focus and forward omitted containers as `undefined`.
  Menu intent timers (PATCHES #1) rely on `PT-CONTAINER-06`
  stability — no Portal surface change.

**Overlay tails (joint with Menu, same batch)**
- #5 trigger-toggle → LANDED: RETURN-TO-COORDINATOR-TARGET,
  coordinator-named only. Trigger keeps native focus; input-paired
  coordinators return focus in consumer `onClick` (runs before the
  toggle request, pinned by `OV-TRG-03` log order). DateField's
  `onTriggerClick` + `DF-CAL-03` is the conforming consumer half;
  Combobox select-only needs nothing (Trigger is the focus source).
  No source change, no new prop, no new `OV-*` title.
- #6 tab-bridge reject → LANDED: OPTIMISTIC-STANDS, documented final.
  Rejecting parent: one `onDismiss`, focus stands where Tab put it,
  open DOM retained. Pinned by the extended `OV-TRG-05` fixture
  (reject bridge in `dialog-fixture.tsx` + CT `OV-TRG-05 reject`,
  same ID). Menu `MN-CLOSE-08` adaptation is the joint freeze —
  no Menu change; Popover inherits with no fixture.
- Docs: `FEATURES.md` #5/#6 LANDED, `DECISIONS.md` landed list,
  `Overlay.md` "Trigger toggle focus" + "Tab-bridge reject" sections.

## Remaining / handoffs

- Portal 8 `[ ]` coverage rows (`PT-DOM-02/04/06/07`,
  `PT-REACT-03/04`, `PT-ENV-04`, `PT-COMP-01/02`) — future pin work,
  no behavior gap. `NEXT.md` matrix counts stale (noted in SPEC).
- DateField PATCHES #10 acceptance is satisfied by the existing
  `DF-CAL-03` (input focus on both toggle edges, green) — DateField
  crew/captain to close.
- `FEATURES.md` header ("every item needs HQ call") now stale — all
  6 landed; left per the #1–4 landing pattern. Optional cleanup.
- Not mine, untouched: root `DECISIONS.md`, `DateField.tsx`,
  `RovingFocus/grid.ts` (sibling crews, per `git status`).

## Suites + results (`pnpm agentct`, React 19 unless noted)

- Portal full: unit 7/7, CT 15/15.
- Overlay `-g "OV-TRG-05"`: 4/4 (incl. new reject test);
  reject test `--react all`: 17/18/19 green.
- Overlay `-g "OV-TRG-03"`: 4/4 (#5 ordering pin). Overlay unit
  baseline 34/34 (untouched area).
- Joint consumers (read-only): `MN-CLOSE-08` 1/1, `CB-ENV-03` 1/1,
  `DF-CAL-03` 1/1.

## Joints specified

1. Portal late-resolve/SSR → Menu intent + Overlay/Popover/Combobox
   inheritance (Portal SPEC Joints).
2. Portal/Overlay/Menu/Combobox shadow ownership split (Portal SPEC
   Joints; Overlay FEATURES #1 stays the destination half).
3. Overlay #5 return-to-coordinator-target → DateField `DF-CAL-03`.
4. Overlay #6 optimistic-stands → Menu `MN-CLOSE-08` freeze, Popover
   inherits.
