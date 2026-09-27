# wants-presence — W-09 Presence `onExitComplete`

Status: **COMPLETE** (2026-09-27)

Scope: `packages/reference-lib/src/components/Presence` only (+ this log).
Branch: `reference-system` (never switch; never commit — captain commits).
Dep: B-01 landed.

## Spec
- `onExitComplete?(): void` on `Presence`.
- Fired exactly once when content unmounts after a completed exit.
- NOT on interrupted exits; NOT on initial mount.
- Prior art: Motion `<AnimatePresence onExitComplete>` ("Fires when all
  exiting nodes have completed animating out"; single-fire, motion#3454).
- MUST fire even with nested overlays (B-01 wedge case) — prove with test.

## Plan
1. Add `onExitComplete` to `PresenceProps` + `usePresence` options.
2. Centralized fire-on-transition-to-`unmounted` (per-exit generation guard:
   exactly once, survives StrictMode, skips interrupted/initial).
3. Unit: instant-exit fires once; no fire on mount/stay-present; refire on
   second completed exit.
4. E2E (`PresenceExitCompleteFixture`, no new snapshots): transition fires
   once; instant fires; interrupted does not fire; initial mount does not
   fire; born-closed nested wedge fires parent; coordinated nested fires both.
5. `pnpm --dir packages/reference-lib sync`, then `pnpm agentct Presence`.

## Result
DONE. `onExitComplete` shipped on `Presence` (+ `usePresence` options).

Design: per-exit generation guard (`exitId`/`firedExitId`); present-true
cancels the pending exit; one central `finishExit()` owns all 7 completion
paths (event, WAAPI, GSAP, fallback, descendant release, coordinator
release, instant) and fires synchronously — a first passive-effect cut
dropped the nested child's fire when parent+child completed in one commit
(PR-EXIT-06 caught it).

Proof (`pnpm agentct Presence`, React 19, styles synced first):
- Unit: 20 passed, 0 failed (new PR-EXIT-07/08).
- E2E: 13 passed, 0 failed (new PR-EXIT-01–06; existing 7 + snapshots
  unmoved). Wedge case PR-EXIT-05 green: born-closed nested child,
  parent fires once, child silent.
- Videos unplayable in this env (binary refs unsupported); verified via
  finished-state screenshots (counters 1/0 wedge, 1/1 coordinated).

Files: Presence.tsx, Presence.test.tsx, Presence.story.tsx,
__e2e__/Presence.ct.spec.ts, Presence.md, TESTS.md, SPEC.md. No commit
(captain commits). Flags for HQ: none.
