IN PROGRESS — RovingFocus quarantine-landing crew

## Baseline (2026-09-25, BEFORE changes)
- `pnpm agentct RovingFocus`: unit 0 tests (no colocated file), e2e 5/5 pass (react19).
- Current dir: `packages/reference-lib/src/components/RovingFocus/` (RovingFocus.tsx 361 lines, story, CT spec, 10 snapshots, SPEC/TESTS/RovingFocus.md, index).
- Subagent fan-out rejected (root 8/8 busy) — analysis inline.

## Quarantine analysis (commit 088e4a70c, read-only)
- Colocated `RovingFocus.test.tsx` (+200, 8 its) == matrix unit file content. 7 of 8 align
  with current TESTS.md contract: RF-TYPE-02/03/04/05/07/08 (model unit) + RF-ENV-01 (SSR).
- RF-API-01 encodes MANGLED API (no currentId/defaultCurrentId/onCurrentIdChange,
  ReferenceSlotPartProps, StyleProps) — SUSPECT, will not port.
- Quarantine source: pure `TypeaheadModel` extraction (Unicode collator, same-letter
  cycling, hidden-skip, 1000ms idle) + helpers (`isItemAvailable`, `getItemSearchText`,
  `extractVisibleText`, per-element `getDirection`, editable/composing guards) +
  registration-version settlement (stale-current repair) + SSR claim-first-tab-stop.
- SUSPECT / will not port: controlled-mode + `id`-prop removal, StyleProps/
  splitCssProps plumbing, 2D grid nav (feature, needs browser proof), stopPropagation
  nesting, capture-phase Space, click-sets-current, Fragment rejection,
  `getDeepActiveElement` (dead export), book file.

## Port plan (stability + test-case wins only, visuals frozen)
- NEW `typeahead.ts`: `TypeaheadModel` + `TypeaheadItem` (pure extraction, no DOM).
- NEW `RovingFocus.test.tsx`: RF-TYPE-02/03/04/05/07/08 verbatim vs model;
  RF-ENV-01 re-targeted to current `RovingFocus.Root`/`Item` API. RF-API-01 skipped.
- `RovingFocus.tsx` (minimal, API-identical): delegate typeahead to model;
  per-element RTL; `isItemAvailable` filtering; settlement+repair effect;
  SSR claim-first-tab-stop; editable/composing guards; timer cleanup.
- SPEC.md/TESTS.md/story/CT untouched (contract + frozen visuals).

## Implementation (2026-09-25)
- NEW `typeahead.ts` (118 lines): `TypeaheadModel` + `TypeaheadItem`, pure, no DOM.
- NEW `RovingFocus.test.tsx`: 7 tests (RF-TYPE-02/03/04/05/07/08 verbatim vs model;
  RF-ENV-01 re-targeted to `RovingFocus.Root`/`Item`). RF-API-01 deliberately skipped
  (encodes mangled API: stripped controlled mode + StyleProps).
- `RovingFocus.tsx`: model delegation; per-element RTL (`getDirection`);
  `isItemAvailable` filtering; settlement+repair effect (`registrationVersion`);
  SSR claim-first-tab-stop; editable/composing guards; timer cleanup on unmount.
  Public API unchanged (props, exports additive-only: `TypeaheadModel`,
  `TypeaheadItem`). Helpers kept module-local; `getDeepActiveElement` skipped (dead
  export in quarantine). No DOM/style/classname changes — visuals frozen.

## Verification (AFTER)
- `pnpm agentct RovingFocus`: unit 7/7 pass; e2e 5/5 on react19 (snapshots green,
  unmodified baselines), 15/15 on `--react all` (17/18/19 behavioral).
- Consumers still green: Listbox e2e 4/4, Menu e2e 2/2 + unit 5/5.
- `tsc --noEmit`: zero errors in RovingFocus files; 3 pre-existing errors remain in
  untouched files (`playwright/ct.ts`, `Slot.test.tsx`) — not mine, not touched.

## Visual check (view-story, 2026-09-25)
- RovingFocus has no Book story of its own (headless kernel) — viewed through
  consumers: Listbox SingleSelection + Menu StandardDropdown @ :5000 (dark).
- Live play: click Vue -> selected; ArrowDown -> Svelte active; focus ring
  visible; console 0 errors (7 pre-existing css() static-miss warnings, unrelated).
- CT finished screenshot == baseline snapshot byte-identical
  (`typeahead-blueberry-focused.png`, 17537 B): Blueberry focused+ringed, Banana
  skipped. Visuals frozen confirmed.
- Video attach unsupported in this runtime (no ffmpeg either) — judged from
  finished-state PNGs + baselines instead.

## UX sign-off (nested ux-designer review) — APPROVED
- Look: PASS (visuals frozen; diff has zero className/style/role/attribute writes).
- Feel: all 7 approved — (1) RF-TYPE-04 cycling: live-verified s->Svelte->Solid->
  Svelte, fixes stuck-focus; (2) RF-TYPE-07 collator: matches TESTS.md, unit-pinned
  (not story-observable); (3) RF-TYPE-08 hidden-skip: unit-pinned (not
  story-observable); (4) RF-KEY-02/10 per-element RTL: verified live under RTL
  (vertical; no horizontal consumer in Book); (5) RF-TAB-06 repair: matches TESTS.md
  (needs React-level removal; no CT); (6) RF-ENV-01 SSR stop: unit-pinned, live
  [0,-1,-1,-1]; (7) RF-TYPE-10 IME/editable: guards match TESTS.md (no CT).
- A11y: no regressions (roles/names/states untouched; exactly-one-tabindex-0;
  Escape restores focus with visible ring).
- Handoffs for Listbox crew (pre-existing, NOT this port): (a) Listbox engine
  consumes IME-composing keys (focus stolen mid-composition); (b) dir=rtl centers
  option labels. Minor: click-opened Menu parks focus on container (pre-existing
  Menu policy).
- Reviewer method note: shared MCP browser hijacked by sibling crews -> fell back
  to `pnpm capture` (dedicated browser); all numbers from remount-guarded runs.

## Commit-ready arc (one commit per component, landing law)
- M `packages/reference-lib/src/components/RovingFocus/RovingFocus.tsx`
- A `packages/reference-lib/src/components/RovingFocus/typeahead.ts`
- A `packages/reference-lib/src/components/RovingFocus/RovingFocus.test.tsx`
- (Log `.agents/missions/quarantine-landing/roving-focus.md` is mission tracking,
  not part of the component commit.)
- Proof: unit 7/7, e2e 15/15 (--react all), snapshots green unmodified,
  consumers green, tsc clean in-dir, UX APPROVED. Never left reference-system;
  never committed (captain lands it).

COMPLETE

