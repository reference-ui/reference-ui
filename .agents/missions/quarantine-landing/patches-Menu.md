# Menu PATCHES crew log

IN PROGRESS — Menu PATCHES crew, reference-system branch.

## Verdict: NO-OP (all 3 items blocked on other landings — verified against code)

PATCHES.md holds 3 mechanical items, each explicitly gated on another
crew/landing. Verified each gate is still closed in the tree:

1. **Intent timer wiring** — blocked on FEATURES.md #1 nested submenus.
   `Menu.tsx`/`index.ts` expose no nested submenu anatomy (no recursive
   `Menu`, no submenu Trigger/Content; grep for Sub/SubTrigger/
   SubContent/nested in Menu source: zero hits). `menu-intent.ts` is
   landed-but-unwired by design; there is nothing to wire it onto.
   Landing submenus would be FEATURES work (needs the submenu-arc
   design call), beyond PATCHES scope.
2. **Space-as-search during active typeahead buffer** — blocked on the
   RovingFocus crew's typeahead-session gate. `RovingFocus.tsx` keeps
   its typeahead model ref and context module-private (only
   `TypeaheadModel` class + types exported; no context/hook/session
   export), so MenuItem's Space path cannot observe buffer state.
   A Menu-local shadow buffer would fork RovingFocus behavior,
   explicitly forbidden by MN-TYPE-04 ("the Menu adapter must not fork
   RovingFocus behavior"), and Listbox shares the gate. Touching the
   RovingFocus dir is out of scope.
3. **Shadow DOM composed-path ownership** — blocked on the Overlay crew
   defining ownership once. Overlay `PATCHES.md` is empty and Overlay
   `FEATURES.md` #1 (shadow destination rule: consumer-authored vs
   automatic, who owns composed-path dismissal) is OPEN awaiting the HQ
   call. Menu-side adoption now would preempt that decision.

No code touched.

## Proof

- `pnpm agentct Menu`: Unit passed (8 tests, workspace React 19);
  E2E 30/30 passed on react19, 0 failed. All frozen snapshots pass
  unmodified.
- Nested ux-designer review (subagent 01a0dd7b): PASS (no-op) —
  zero Menu files changed, no drift possible.
- `git status` scoped to the Menu dir: clean, no changes.

## Commit

None — Menu dir untouched, nothing to land. No commit created
(committing only this log under 'Menu: land PATCHES' would
misrepresent a landing).

COMPLETE
