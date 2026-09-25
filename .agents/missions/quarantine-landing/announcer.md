COMPLETE — Announcer reconciliation (quarantine-landing mission)
Crew lead: Announcer. Branch: reference-system (never switch; quarantine read via git show/diff only).

## Baseline (pre-change, 2026-09-25)
- `pnpm agentct Announcer`: unit 5/5 pass; e2e "No tests found" (no `__e2e__` dir — expected).
- reference-system Announcer dir is byte-identical to quarantine base `7aea45265` (clean port target).
- Call sites (read-only): `ReferenceLibrary.tsx:180` renders `<AnnouncerHost />` (no props);
  `Toast.tsx` `maybeAnnounce` calls `announce(msg, {document})` imperatively from `showToast`.

## Quarantine analysis (commit a19418ed3)
- Recon §4 mangling exhibits do NOT touch Announcer (no uncontrolled-mode removal, no motion
  strip, no focus-theme edit). Announcer rewrite maps 1:1 onto SPEC's own "Defects this freeze
  names" 1, 2, 3, 5 — it is the clean salvage case.
- Host style values byte-identical (hoisted to `HOST_STYLE` const) → zero visual delta possible;
  component is intentionally invisible (clipped 1x1, no aria-hidden).
- `Announcer.book.tsx` NOT ported: stale `.book.tsx` convention, current tree uses `.story.tsx`.
  No Announcer story exists; visual check goes through ReferenceLibrary story (mounts the host).
- Matrix e2e/unit (`announcer.spec.ts` 723 lines, fixtures) NOT portable: outside component dir
  (read-only), belong to test-core/matrix crews for re-targeting against mangled-API caveat.

## Port (all byte-identical to quarantine tip files unless noted)
- `Announcer.tsx`: sticky-`activated` reset + text clear on last unmount (defect 1, ANN-LIFE-04/05/06);
  `resolveAnnouncerDocument` + mounted-doc registry + dev diagnostic for ambiguous untargeted
  calls (defect 2, ANN-API-05/RL-ROOT-08); `safeGetGlobalDocument` SSR guards (ANN-API-06);
  host election via `activePrimaryHosts` + optional `document` prop, second mount renders null
  (ANN-HOST-04); pending cap 50 `MAX_PENDING_ANNOUNCEMENTS` (ANN-LIFE-07); replay aborts when
  subscribers hit 0; `aria-atomic="true"` + `data-reference-announcer` contract selectors
  (testids kept as aliases, ANN-DOM-01/05); forced sync notify on clear/insert/recycle.
- `Announcer.test.ts`: 5 → 12 tests (7 new ANN-*, 5 dual-titled TO-ANN/ANN siblings).
- `TESTS.md` ADDED: case catalog (matches ReferenceLibrary TESTS.md convention).
- `SPEC.md` (minimal bookkeeping): 7 unit/ssr checkboxes → [x] (API-01/06/07, LIVE-08,
  ENV-01/02/04); all [browser] cases stay [ ] (no browser proof in this crew); pending-50 cap
  documented in Freeze per ANN-LIFE-07; status counts updated (7/41, 12 Vitest).

## Progress
- 21:27 baseline agentct: unit 5/5, no CT.
- 21:30 after port: `pnpm agentct Announcer --unit` 12/12 pass.
- Regression (read-only): `pnpm agentct Toast --unit` 52/52 pass; ReferenceLibrary unit n/a
  (no colocated file). `tsc --noEmit`: zero Announcer errors (only pre-existing ct.ts/Slot
  errors in untouched files).
- view-story check (2026-09-25): Toast Basic story (mounts host via ReferenceLibrary).
  Playwright MCP a11y snapshot: `status` + `alert` regions present. DOM evaluate: exactly 1
  host, `data-reference-overlay-ignore` set, no `aria-hidden`, computed clipped 1x1 absolute,
  1px box at (-1,-1), both regions role/live/`aria-atomic="true"` + contract selectors +
  testid aliases, empty at rest. `pnpm capture Toast Basic` (own browser; shared MCP browser
  was mid-use by a sibling crew): HOST_COUNT=1 ATOMIC_POLITE=1, screenshot
  `.reference-ui/captures/Toast_Basic_resting.png` shows clean canvas, no host artifact.

## UX review (ux-designer skill method; SELF-performed — nested spawn rejected, root 8/8 full)
- Look: PASS. Host style values byte-identical to pre-change (hoisted const, same 8 props);
  live computed style + screenshot confirm zero paint delta. Component remains invisible.
- Feel: (1) activation reset on last unmount — APPROVE, restores SPEC-intended pending replay,
  fixes failover-gap silence; (2) ambiguous untargeted no-op + diagnostic — APPROVE, matches
  Toast/RL-ROOT-08 freeze, targeted calls unaffected; (3) election, 2nd mount null — APPROVE,
  kills double-speech, no-op in supported single-host path; (4) pending cap 50 — APPROVE,
  documented freeze bound, no supported flow queues 50; (5) aria-atomic + contract selectors —
  APPROVE, SPEC-freeze compliance, testids kept as aliases; (6) forced flushSync notify —
  APPROVE, sync AT-observable commits, callers verified imperative-only, no-target envs caught
  (ANN-ENV-04).
- Accessibility: aria-atomic full-message speech (improvement); host/regions not aria-hidden;
  regions not tab stops; live semantics remain off toast DOM. No new issues.
- Artifacts: Announcer dir diff vs HEAD, MCP DOM-evaluate JSON, Toast_Basic_resting.png,
  12/12 unit. No CT video/snapshots exist (unit-only component).
- Verdict: APPROVE. Caveat: reviewer = crew lead (capacity exhaustion); recommend a blind
  re-review only if mission rules require strict nesting.

## Surprises / handoffs
- `setLiveMessage` now always `flushSync`s (quarantine behavior, kept faithfully). Safe for
  current callers (Toast announces imperatively from event handlers, never during render).
  Flagged for UX review as the one behavior change with render-timing implications.
- New `export *` surface: `MAX_PENDING_ANNOUNCEMENTS`, `register/unregisterAnnouncerDocument`,
  `announcerDiagnostic`, `resolveAnnouncerDocument`, `getAnnouncerStore`. No lib-root name
  collisions (tsc clean). DEFECT-4 (export leak) direction still open for a future freeze pass.
- Handoff to test-core/matrix crews: re-target `matrix/lib/tests/e2e/announcer.spec.ts` +
  fixture from quarantine commit a19418ed3; colocated 12 are the store/ssr floor, not AT proof.
