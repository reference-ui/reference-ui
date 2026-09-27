COMPLETE
# Presence-crew lead log (playtest mission, relaunched)

- Branch: reference-system (never switch; never commit — captain commits)
- Scope: packages/reference-lib/src/components/Presence + FocusLock (+ colocated tests/stories). Overlay Content READ-ONLY unless B-01 root cause provably lives there.
- Bugs: B-01 (exit wedges with nested overlay — Critical), B-03 (React 19 element.ref console error) from docs/MISSIONS/PLAYTEST-REQUIREMENTS.md Part 1.

## Plan (fail-first: tests before fixes)
- B-03 root cause: Presence `getElementRef` fallback reads `(element as any).ref`, and FocusLock reads `(child as …).ref ?? …` — on React 19 `element.ref` is a deprecated accessor that logs on ANY read. Fix: shared descriptor-only `getElementRef` (new `Presence/elementRef.ts`, internal, not exported from index) that never invokes a getter; wire into both files. Tests: PR-REF-05 (`Presence/elementRef.test.tsx`, fresh registry: throwing-getter synthetic element + real-element + console-error-on-mount), FL-REF-01 (`FocusLock/FocusLock.ref.test.tsx`, console-error-on-mount).
- B-01 root cause: `usePresence` mount effect registers EVERY nested instance as a pending descendant, including born-closed ones (`<Presence present={isOpen}>` in Overlay Content, read-only) that never transition and never report complete; parent's `handleExitComplete` (incl. 5s fallback) returns early while the set is non-empty → wedge. Fix (Presence-only, no Overlay change): register at exit-start (both suspend paths) instead of on mount; keep exit-cancel/unmount unregister. Proof sketch: only suspended instances register, every suspended instance completes via events or the 5s fallback, finite tree → no deadlock. Tests: PR-NEST-05 (born-closed child, parent with 150ms exit completes), PR-NEST-06 (child opened+closed during parent suspension still coordinates) in `Presence.ct.spec.ts` + new story `PresenceNestedBornClosedFixture` (separate story: no churn to existing snapshots).
- Verify: `pnpm agentct Presence`, `pnpm agentct FocusLock` (unit+e2e React 19), plus `--e2e --react all` for the B-03 facet.

## Fail-first proof (all reproduced pre-fix)
- elementRef synthetic throwing-accessor test: FAILED pre-fix (old logic invokes the getter once).
- FL-REF-01: FAILED pre-fix — real `Accessing element.ref was removed in React 19` console error on 19.2.4 with a ref-carrying FocusLock child.
- PR-NEST-05: FAILED pre-fix — born-closed nested child strands the 150ms parent exit (count stays 1 past 2s). B-01 wedge reproduced.
- React-version finding (read installed 19.2.4 source): the `element.ref` deprecation getter is armed ONLY when the element carries a ref (19.0/19.1 armed it unconditionally — that is the playtest's every-mount error). Ref-less elements carry `ref: null` data. Consequence: Presence's fallback is silent on 19.2.4 but warned on 19.0/19.1; FocusLock's unconditional `.ref` read warns on all 19.x whenever the child has a ref. The descriptor-only fix silences all majors/minors; the synthetic test (not the console tests) is the version-independent proof.

## Fixes landed (Presence + FocusLock only; Overlay Content untouched, read-only honored)
- B-03: new internal `Presence/elementRef.ts` — descriptor-only `getElementRef`, never invokes a getter. Wired into `Presence.tsx` (deleted local copy) and `FocusLock.tsx:522` (replaced `(child as …).ref ?? …`). Not exported from index (no public API change).
- B-01: `usePresence` registers descendants at exit-start (both suspend paths, incl. coordinator branch) instead of on mount; mount effect keeps unmount-only cleanup (PR-NEST-03); exit-cancel unregister kept (PR-NEST-02). Only suspended instances register; every suspended instance completes via events or the 5s fallback; finite tree → no deadlock. Born-closed `<Presence present={isOpen}>` (Overlay Content) never registers.
- Tests: PR-REF-05 (`elementRef.test.tsx`, 7 its), FL-REF-01 (`FocusLock.ref.test.tsx`), PR-NEST-05/06 (`Presence.ct.spec.ts` + `PresenceNestedBornClosedFixture` story — separate story, zero churn to existing snapshots). TESTS.md/SPEC.md index entries added (catalog 48→51, named 17→20).

## Verification (test-component skill)
- Presence unit: 18/18 pass. FocusLock unit: 18/18 pass.
- Presence e2e React 19: 7/7 (incl. new PR-NEST-05/06). FocusLock e2e React 19: 44/44.
- Presence e2e --react all: 21/21 (7 per major).
- FocusLock e2e --react all: r17 41/44, r18 42/44, r19 44/44. The 17/18 failures (FL-TAB-01 catalog, FL-CAND-09, FL-NEST-06-on-17) are PRE-EXISTING — proven by re-running those specs on pristine sources via targeted stash (failed identically), then popped cleanly.
- 2 new snapshot baselines (bornclosed-*.png) were written by the runner on first run; inspected (buttons-only settled state, correct) and green on re-run. No --update-snapshots passed; no existing baseline touched.
- tsc --noEmit: zero errors in Presence/FocusLock/elementRef files.
- Video .webm files could not be viewed in this environment (binary); verified via settled screenshots + timing assertions instead.

## Flags for HQ
1. FocusLock React 17/18 failures above need an owner (pre-existing, out of presence-crew scope; non-causality proven).
2. B-01's dist half (contextValue memo incl. state, false→true brick) is B-11 dist-freshness territory; src memo already clean — no action taken.
3. 2 new snapshot PNGs + 3 new test files are untracked; captain to commit. Never committed, never switched branches (reference-system throughout).

COMPLETE
