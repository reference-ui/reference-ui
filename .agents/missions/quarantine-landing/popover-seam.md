# Popover override-seam crew log

Mission: quarantine-landing. Branch: reference-system (stay; never commit).
Task: minimal override seam so consumers CAN override `aria-haspopup` (Trigger)
and `role` (Content); DEFAULTS UNCHANGED (`dialog`/`dialog`).

## Header (start)
- Popover.tsx:549 hardcodes `aria-haspopup="dialog"` after spread; :588 hardcodes
  `role="dialog"` after spread. Confirmed read-only.
- Overlay sets neither attribute (grep clean) — seam lives purely in Popover.
- Menu FLAG(#4) comments (read-only): `Menu.test.tsx:78,183`,
  `__e2e__/Menu.ct.spec.ts:13,126,172` assert actual `dialog`; Menu dir UNTOUCHED.
- Stance: `docs/MISSIONS/API-STANCE.md` — controllability/customization theme;
  simplest contract that can hold forever. Seam = destructure-with-default.
- Skills read: test-component, ux-designer.

## Progress
- [x] Step 1: recon (Popover lines, Overlay grep, Menu FLAGs, stance)
- [x] Step 2: seam implemented (destructure-with-default, 4 edits in Popover.tsx)
- [x] Step 3: seam tests added (override-seam.test.tsx, PO-SEAM-01..04)
- [x] Step 4: `pnpm agentct Popover` GREEN (unit 20 pass; e2e 18/18 react19, 13 snapshots unmodified+passing)
- [x] Step 5: `pnpm agentct Menu` collateral RED — pre-existing, NOT my change (see Finding M-1)
- [x] Step 6: nested ux-designer review OK (look APPROVE; tail truncated, flagged)
- [x] Step 7: report

## Evidence
- Popover: `pnpm agentct Popover` → Unit: passed, 20 tests (incl. new
  PO-SEAM-01..04); E2E: 18 passed / 0 failed (react19). 13 snap()
  baselines passed unmodified — visuals frozen, no snapshot writes.
- Menu collateral: `pnpm agentct Menu` → Unit 1 passed/7 failed, E2E 0/30.
  ALL failures are `Menu is undefined` import-time breakage
  (`TypeError: Cannot read properties of undefined (reading 'Item')`;
  CT: `index.ts does not provide an export named 'Menu'`).
- Causality proof: stashed ONLY Popover.tsx (my edit) → Menu unit fails
  identically (7 failed, same TypeError) → popped stash, diff verified
  intact. No FLAG assertion executed, so the STOP condition
  (FLAGged assertions breaking = defaults changed) did NOT trigger.
  Cause: concurrent Menu crew's uncommitted `M Menu.tsx` (exports only
  useMenuTriggerKeys/MenuTrigger/MenuContent right now). Menu dir untouched.

## Finding M-1 (flagged, not mine)
- Menu suite is red on `reference-system` working tree due to the Menu
  crew's in-flight refactor. My seam defaults are proven unchanged
  (PO-SEAM-01/03 + full Popover suite green). Menu flips its FLAGged
  `dialog`→`menu` assertions in its own later pass per mission plan.

## UX verdict (nested subagent, ux-designer method)
- Look: APPROVE — attribute-only diff, byte-identical defaults, no
  paint/chrome/motion/DOM-structure change; 13 snapshots green.
- Feel/a11y tail: TRUNCATED in delivery (flagged). Corroborating read:
  feel unchanged (no behavior/focus/keyboard code touched); a11y no
  regression on defaults, override enables honest `menu` semantics.
- Artifacts judged from: git diff (4 lines), agentct Popover results,
  snapshot pass list. No videos reviewed (motion inputs untouched).

## Files changed (only these)
- `packages/reference-lib/src/components/Popover/Popover.tsx` (4 lines)
- `packages/reference-lib/src/components/Popover/override-seam.test.tsx` (new)
- `.agents/missions/quarantine-landing/popover-seam.md` (this log)
- Branch: reference-system throughout; no commits; Menu dir untouched.
