# PATCHES crew log — Splitter

Crew: Splitter PATCHES. Branch: reference-system (never switch; never commit).
Scope: packages/reference-lib/src/components/Splitter/** + this log only.
Visuals frozen: all existing snapshots must pass unmodified.
Proof: `pnpm agentct Splitter` (unit + e2e green).
UX: nested ux-designer review of the delta.

NOTE: tree has another crew's in-flight work (M Listbox.tsx, other logs) — not mine, leaving alone.

## Items (from PATCHES.md)
- [x] 1. Full pointer-session robustness contract (SP-DRAG-01, 04–12; SP-END-01/03/04) — LANDED
- [x] 2. Keyboard interaction sessions (SP-END-02, SP-KEY-02/07 + landed SP-KEY-04) — LANDED
- [x] 3. Enter collapse/restore (SP-COLLAPSE-01/02/03; SP-COMP-01 proof) — LANDED
- [x] 4. RTL direction wiring (SP-MATH-09, SP-KEY-05/08, SP-DRAG-02, SP-DOM-05 on [rtl]) — LANDED
- [x] 5. Environment and composition proof suites — NO MECHANICAL REMAINDER (verified below)
- [x] 6. prefers-reduced-motion on Handle transitions — LANDED
- [x] 7. SP-A11Y-01 checker sweep execution — LANDED (explicit-assertion sweep; qualified below)

## Recon findings (ground truth for the build)
- Quarantine `c7bdd1f7c` IS in history; read all 1123 lines of its `Splitter.tsx` as the source model.
- RTL primary = `handleIndex + 1` (quarantine `getHandleAria` + TESTS SP-KEY-05 "primary B"). PATCHES-4 "right Panel" = DOM-second; freeze SPEC-4 parenthetical "(right in RTL)" is loose about visual position — cases rule.
- `data-resizing`: quarantine sets it on Root + active Handle + own Panels (direct DOM at pointerdown + React mirror). Port that.
- Perd-item conflicts resolved TESTS-over-quarantine: lost-capture / window-blur / buttons=0 moves are CANCEL paths (no `onChangeEnd`) per SP-END-03 (+ PATCHES-1 "one cleanup on every cancel path with no onChangeEnd"); quarantine emitted end on lost-capture/blur. Secondary-click termination: quarantine emits `onChangeEnd` (DRAG-12 never forbids it; END-03's cancel list omits it) — port quarantine.
- Container-rect drag denominator STAYS (FEATURES-12 owns panel-axis-sum; changing it alters shipped drag feel).
- No `aria-disabled` (FEATURES-11 owns the UX call); no stable-ID restore memory (FEATURES owns reinsert semantics) — position-keyed memory for PATCHES-3.
- `aria-orientation` flips to perpendicular per SP-A11Y-01's own assertion list (item 7); no existing test pins the old value.
- Reduced-motion convention: Toast's `<style>{CSS}</style>` + `@media (prefers-reduced-motion: reduce)` — mirror with a `splitterStyles.ts`.
- No axe/checker configured anywhere in repo (item 7: explicit-assertion sweep, no new deps).
- `matrix/lib` does NOT exist on this branch (item 5: verify + report, no work).
- Only external import is `src/index.ts` re-export — internals free to reshape.

## Timeline
- START session: log header written; reading source + contracts next.
- RECON done (see above). BASELINE `pnpm agentct Splitter` starting (pre-change).
- BASELINE green: unit 16 passed; e2e 8/8 passed (react19). No changes yet.
- START items 1+2+3+4+6 (one Splitter.tsx session/keyboard/RTL/reduced-motion rewrite; stories + CT tests follow per item).
- CODE done: Splitter.tsx rewritten (root-owned pointer session, keyboard sessions, Enter collapse/restore, RTL primaries, panel id registry, data-resizing/collapsed hooks, perpendicular aria-orientation); splitterStyles.ts added; 10 stories added.
- TESTS written: 21 new CT tests (item 1: 11, item 2: 4, item 3: 4, item 4: 5, item 6: 1, item 7: 1) + SP-END-01 extension.
- FULL `pnpm agentct Splitter` starting (post-change).
- RESULT: 16 passed / 13 failed. Failure analysis (all understood):
  - Class A (8 tests): drag math drift (50.05 not 50) — story containers have 1px borders, so the Splitter root measures 398px, not 400. Fix: de-bordered Constrained + new drag fixtures (exact 400px math). No snapshot risk (Constrained/Basic/Vertical/CollapsibleDemo snapshots: only Basic+Vertical are snapshotted, untouched).
  - Class B (END-04): same clamped candidate re-emitted per move under a rejecting parent. REAL CODE FIX: solveAndEmit now compares against lastRequested, not controlled value.
  - Class C (DRAG-06): synthetic move/up recomputed the handle center AFTER echo moved it (overshoot to 60/40). Fix: dispatchPointer absolute xy.
  - Batching (DRAG-05): sync innerText read after dispatch misses React 18 batched flush. Fix: phased evaluates + auto-retry asserts.
  - DRAG-01 probe: target-phase queueMicrotask reads state BEFORE React 19's root-bubble handler (proven via stack-trace probe: my handler runs, capture+focus+resizing all true at setTimeout time). Fix: read after the down round-trip.
  - Motion: guard works; Chromium serializes `transition:none` duration as `1e-05s`. Fix: assert transition-property none.
  - A11Y: my row count wrong (7 handles, not 6) + disabled readout nulled by `?? ''`. Fixed.
- INCIDENT: scripted border-removal regex corrupted Splitter.story.tsx (misassembled exports, 5 story bodies lost). Recovered via git checkout + manual re-application of all stories (de-bordered) with edit_file. Verified: 15 exports, borders only on Basic/CollapsibleDemo/Vertical/A11ySweep. Lesson: no untested regex rewrites; use edit_file.
- RE-RUN `pnpm agentct Splitter` starting (post-fix).
- RESULT: 35/36 e2e + 16/16 unit. Sole failure DRAG-09(ii): browser dispatches lostpointercapture asynchronously (input pipeline, after the evaluate round-trip) — test now waits for the hook to clear. Re-ran solo: green.
- FINAL FULL `pnpm agentct Splitter` starting.
- FINAL GREEN: e2e 36/36 (react19) + unit 16/16. Snapshots unmodified (git status shows no __snapshots__ changes).
- LAND item 1: root-owned pointer session (capture+focus+data-resizing on primary down; group owner; pointerId isolation; button/isPrimary gating; body selection-lock + axis cursor; nested isolation via per-root sessions; secondary-click terminate-with-end; cancel paths pointercancel/lost-capture/buttons-0/blur/disable/removal/unmount with no onChangeEnd; last-request dedup for rejecting parents). 11 CT tests + SP-END-01 extension.
- LAND item 2: keydown opens/extends session (Arrow/Shift+Arrow/Home/End/Enter), keyup emits one onChangeEnd; blur/disable/unmount cancel; ctrl/meta/alt + cross-axis + special/printable pass through unprevented. 4 CT tests.
- LAND item 3: Enter collapse (solver-routed collapsedSize) / restore (position-keyed newest-expanded memory, clamped to live constraints); non-collapsible Enter unprevented. + SP-COMP-01 LTR/RTL sidebar proof. 4 CT tests.
- LAND item 4: inherited-dir RTL (closest-[dir] + document + observer, re-read every render); primary flips to DOM-second panel; drag + horizontal arrows negate; aria-controls/valuenow follow primary; values stay DOM-paired; vertical untouched. 5 CT tests.
- ITEM 5 VERDICT — no mechanical remainder: `matrix/lib` does not exist on this branch (`matrix/` holds only chain/mcp contract specs; SPEC.md already records the absence). The item is explicitly matrix-only proof; my touch scope is the Splitter dir. SP-COMP-02 additionally blocked on unlanded FEATURES measured constraints; SP-COMP-01/03 behavior covered at CT level by items 3/1 (DRAG-11, COMP-01). No code written, none owed.
- LAND item 6: splitterStyles.ts (`transition:none !important` under `prefers-reduced-motion`, Toast convention, `<style>` in Root) + `data-reference-splitter-handle-line` hook; 1 CT test (property none under reduce, 0.15s intact otherwise).
- LAND item 7 (qualified): SP-A11Y-01 sweep executed as explicit assertions over horizontal/vertical/three-panel/mixed-constraint/collapsed fixtures (names, perpendicular orientation, valid ranges, in-group aria-controls, disabled state per current contract). Qualifications: (a) no axe-style checker is configured anywhere in the repo, so "zero violations" is covered by direct assertions, not a checker run; (b) full SP-A11Y-01 green awaits FEATURES per-Handle disable (aria-disabled semantics are an open UX call — deliberately not implemented). Perpendicular aria-orientation flip included (written in the item's assertion list; no existing test pinned the old value).
- React 17/18: solo runs green (36/36 each). Found + fixed a REAL cross-version bug: React 17 CT useId shim mints a fresh id per render, causing panel-id churn and an infinite registration loop; fixed by pinning first-render id in Panel. `--react all` combined runs flake ~10 tests on one gallery per run with the failing gallery varying (17, then 18) — shared-box load contention (other crews testing concurrently), not a code defect: every gallery passes solo, 19 twice.
- SPEC.md bookkeeping: case index updated (47/83 [x], CT 36), "Still open" Enter/RTL lines retired.
- Typecheck: 0 Splitter errors (fixed 1 KeyboardEventInit variance in my spec helper); 10 remaining package errors are other crews' files, untouched.
- Artifacts: videos unviewable (no webm support in tools, no ffmpeg) — inspected DRAG-11 finished PNG (nested 50/50 + 70/30 correct, thumb on focused handle). All 7 snapshots pass unmodified.
- Nested ux-designer review (subagent, accepted): LOOK PASS (no visual change); all 6 feel changes APPROVED; no new a11y defects (2 minor informational notes: Enter-collapse discovery relies on authors; blur-before-keyup drops the end in an unreachable-via-real-keyboard edge).
- Scope kept: touched Splitter dir (Splitter.tsx, splitterStyles.ts new, story, spec, SPEC.md) + this log only. Never left reference-system; never committed. Other crews' tree changes left alone.

Status: COMPLETE
