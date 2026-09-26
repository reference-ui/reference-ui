IN PROGRESS — NumberField quarantine-landing crew log

## Crew: NumberField (quarantine-landing mission)
- Branch: reference-system @ e22d94f99 (never switch; quarantine tip 89850d1c8 via show/diff/log only; never commit)
- Dir confirmed: packages/reference-lib/src/components/NumberField/
- Quarantine commit: 975fec1ae feat(number-field) — NumberField.tsx 2270/290 rewrite, unit +1215, e2e +1087
- Recon frame: QUARANTINE_RECON.md §3 (NumberField line), §4 mangling exhibits, §6 salvage/suspect split.
  Quarantine .tsx rewrites are SUSPECT (uncontrolled-mode removal, stripped motion/focus, probing
  scaffolding). Salvageable: matrix unit/e2e cases (re-targeted, not blind-copied) + pure extractions.
  NumberField quarantine commit added NO helper/extraction files and NO colocated test — only
  .tsx rewrite + SPEC touch + matrix unit/e2e + book tweak + fixture.

## Plan
1. Baseline `pnpm agentct NumberField` BEFORE changes.
2. Diff quarantine NumberField (975fec1ae + base 7aea45265) vs current; triage stability wins vs SUSPECT visual/API changes.
3. Study sibling landed commits (switch/tabs/field) for the landing pattern (read-only git show).
4. Port ONLY stability + test-case wins; freeze visuals; minimize+flag any visual touch.
5. Prove after with `pnpm agentct NumberField`; view-story visual check; nested ux-designer review.

## Progress
- [x] Baseline agentct (GREEN 5/5, 0 unit)
- [x] Quarantine diff triage (inline; pool-full)
- [x] Port stability wins P1–P7 (NumberField.tsx +~100; typecheck clean)
- [x] Test cases: 15 unit (13 behavior + 2 type) + 11 CT assertion-only (16 CT total)
- [x] Post-change agentct proof: Unit 15/15, E2E 16/16 react19, 14 snapshots untouched+green
- [x] SPEC.md bookkeeping: 24/148 [x] with re-target notes
- [x] view-story visual check + ux-designer sign-off (SELF-REVIEW — nested spawn pool-full twice; flagged)

## Visual check (view-story; MCP pipe broken → authorized pnpm capture fallback)
- Default (42), WithBounds (5), Disabled (7 dimmed) all render correct chrome.
- Interactive script: click Increment 42→43, Shift+ArrowUp →53, correct.
- One transient BOOK_READY_TIMEOUT on Disabled (concurrent-crew load); retry clean.

## UX verdict: APPROVE (self-review by ux-designer method; nested spawn rejected pool-full)
- Look: PASS — zero paint/motion/chrome drift; 14 frozen snapshots green unmodified, no new snaps.
- Feel: P1 handler chaining (dead-typing fix) APPROVE; P1/P5/P6 managed-authority
  APPROVE (contract enforcement, no legitimate override lost); P2 modified-arrows
  native APPROVE (freeze decision 6: Alt stays native); P2 Shift+Home/End native
  APPROVE (removes a trap — was value-jump killing selection; jump still on
  unmodified Home/End, no capability lost); P3 non-primary guard APPROVE; P4
  cleanFloat APPROVE (pure fix); P7 throws APPROVE (fail-fast on junk only; all
  in-repo consumers verified sane; no legitimate NaN/min>max/step<=0 use).
- A11y: no regressions; managed strip improves ARIA honesty (spinbutton role
  unstrippable). Pre-existing observation (not a landing fail): Default story
  ships no accessible name — naming stays the app's job via preserved
  aria-label passthrough (pinned NF-DOM-05).
- Artifacts: .reference-ui/captures/NumberField_{Default,WithBounds,Disabled,
  Default_resting,incremented,shift-stepped}.png + CT finished screenshot
  (DecimalFixture 0.3) + green agentct run. Videos unwatched (runtime limit).

COMPLETE

## Proof notes
- MATH-07 unit initially failed on my own batching bug (3 clicks in one act
  computed from stale 0) — fixed test with separate acts, not source.
- Videos unwatched: binary refs unsupported in this runtime; spot-checked a
  finished screenshot (DecimalFixture shows 0.3). No presence/overlay motion
  in this component; paint covered by frozen snapshots (all green).

## Triage verdict (quarantine 975fec1ae vs current)

Quarantine is a full freeze rewrite (2382-line .tsx, required value+locale,
dirty session, Intl parse/format, snap/validate, Group, hidden form). The
93 e2e + 51 unit cases overwhelmingly assert the FREEZE API — not portable
without the rewrite. Port 7 current-API-compatible wins, adapted:

- P1 Input managed authority (NF-TYPE-03/NF-DOM-06): strip managed
  type/role/value/defaultValue/inputMode/min/max/step/disabled/aria-value*;
  chain user onChange/onFocus/onBlur (today user onChange CLOBBERs the
  internal handler via last-spread → typing silently dies). Keep readOnly /
  aria-invalid passthrough (Field story depends on it).
- P2 Keyboard modifier guards (NF-KEY-03/04/07): arrows ignore alt/ctrl/meta;
  Home/End unmodified-only. NOTE: Shift+Home/End becomes native (was jump).
- P3 Stepper primary-button guard (NF-STEP-09): ignore e.button !== 0.
- P4 cleanFloat in step math (NF-MATH-07/08/14): verbatim quarantine helper,
  fixes 0.1+0.2 drift + canonicalizes -0.
- P5 Stepper disabled = root || authored; strip structural type/tabIndex
  (NF-STEP-11/NF-TYPE-03). aria-label stays consumer-overridable.
- P6 Root managed authority (NF-DOM-06): spread-first, role/data-* win.
- P7 Numeric prop validation throws, adapted (NF-MATH-02): value/defaultValue
  finite-or-null; min/max NaN rejected but ±Infinity allowed (current
  unbounded sentinels — quarantine required finite); step finite > 0;
  min <= max. All in-repo consumers pass sane props (checked Field story,
  Showcase, book). locale NOT validated (vestigial: unused in current engine).

SUSPECT / rejected: controlled-only rewrite + defaultValue removal (recon
exhibit 1); dirty-session/Intl/commit/snap-validate/Group/hidden-form;
zero-anchored lattice (MATH-03/04) + null-step (MATH-05) semantics changes;
spinbutton→textbox (A11Y-01; frozen snapshots assert spinbutton); required
stepper names (TYPE-04 breaking); hold-repeat timers (new behavior); any
visual/styling edits; redundant-onChange suppression (no quarantine
grounding for steppers — deferred).

## Surprises / handoffs
- Baseline `pnpm agentct NumberField` (pre-change): GREEN — Unit 0 tests (no colocated file), E2E 5/5 react19.
- Nested worker spawns REJECTED (root_capacity_exhausted, 8/8 slots — other crews active). Doing triage
  inline instead; will retry nested ux-designer at the end, else self-review flagged explicitly.
- Current SPEC.md describes an unimplemented "freeze" contract (textbox, required value+locale, dirty
  buffer, 0/148 proven) — current engine is "prototype spinbutton + live Number() clamp". Quarantine
  presumably implemented the freeze; that API rewrite is out of scope (SUSPECT). Port small stability
  wins fitting the CURRENT API + re-targeted tests only.
- Sibling pattern (switch 814d55f71): small hardening diff, managed-props discipline, re-targeted CT
  cases with logged skips, SPEC bookkeeping, snapshots unmodified, nested UX sign-off.
