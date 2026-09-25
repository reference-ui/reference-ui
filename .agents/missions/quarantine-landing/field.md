IN PROGRESS — Field crew (quarantine-landing mission), 2026-09-25
Branch: reference-system (never switch; quarantine inspected via git show/diff/log only, tip 89850d1c8). Never commit.

## Brief
Port ONLY stability + test-case wins from quarantine Field freeze (3b2afd0b1) into
packages/reference-lib/src/components/Field/. Quarantine look-and-feel/visual changes are
SUSPECT — preserve current visuals; minimize + flag any visual touch a stability fix needs.
Touch ONLY Field dir + this log. Finish with view-story check + nested ux-designer review.

## Recon recap (QUARANTINE_RECON.md §3-4, §6)
- Field commit 3b2afd0b1: Field.tsx 11/1; drive-by shared-theme edits (field.ts +17,
  focus-visible.ts +9/-3) = Exhibit 3 mangling (focus rings suppressed globally) → SUSPECT, do not port.
- Salvageable: matrix unit +45 / e2e +627 lines with SPEC-case IDs → re-target into Field dir
  (colocated + __e2e__ CT only; matrix/ is outside my touch scope), not blind copy.
- No colocated test change in quarantine Field commit; no CT/snapshots on branch.

## Progress
- [x] Baseline `pnpm agentct Field` (before changes): E2E 11/11, Unit 0 tests
- [x] Inspected quarantine diff (Field.tsx strip, SPEC, matrix unit/e2e 679 lines, fixture)
- [x] Ported stability + test-case wins (Field dir only)
- [x] Proved after (`pnpm agentct Field`): Unit 1/1, E2E 28/28 (20 Field + 3 DateField + 5 NumberField)
- [x] view-story visual check (Book :5000, Playwright MCP)
- [x] nested ux-designer sign-off → **LAND** (subagent 01a0da5c, read-only, reference-system)

## Nested UX verdict (LAND)
- Look: frozen visuals HELD, nothing moved. All 6 Book stories viewed +
  interacted (Default, AlignedWithButton incl. 8.5r height alignment,
  WithPrefixAndSuffix, CustomBorder, Invalid, Disabled); 9 pre-existing
  baselines confirmed byte-frozen; all 8 new baselines viewed, correct
  chrome (incl. amber warning bezel, silent strip fixture).
- Feel: no user-facing behavior change. Keyboard reach sane with visible
  rings; strip approved as documented-contract enforcement (only affects
  callers passing type-prohibited props — a violation no one could rely on).
- A11y: strip ARIA-honest (host exposes exactly class, data-color-mode,
  data-reference-field + data-status when warning); states live on controls;
  label/error association verified. FI-CSS-06 confirmed PRE-EXISTING theme
  behavior (double ring on nested-button focus observed), severity low,
  NOT a regression, NOT a landing blocker — stays flagged for theme crew.
- Reviewer note: its video-path probe used the wrong dir
  (`packages/reference-lib/test-results/`); Field CT videos actually live
  under `packages/reference-lib/playwright/test-results/Field-__e2e__-*/`.
  Videos were unviewable in this environment (no webm attach, no ffmpeg);
  motion covered by live MCP interaction + settled snapshots instead.
- New baselines: reviewer RECOMMENDS committing all 8 — human to confirm.
- Process note: nested spawn rejected 4× with root_capacity_exhausted
  (sibling crews at 8/8); 5th attempt accepted after ~10 min.

## Commit-ready arc (for the landing captain; this crew never commits)
- Files: `Field.tsx` (strip+pin), `Field.test.tsx` (new, FI-TYPE-01),
  `Field.story.tsx` (+8 fixtures), `__e2e__/Field.ct.spec.ts` (3→20 titles),
  `SPEC.md` (19/20 accounting), 8 new `__snapshots__/*.png`, this log.
- Proof: `pnpm agentct Field` → Unit 1/1, E2E 28/28 (20 Field + 3 DateField
  + 5 NumberField regression net); tsc clean for Field dir; 9 frozen
  baselines untouched and green; Book view-story clean (0 console errors).
- Needs: human confirm on the 8 new baselines at commit review.

## view-story notes (2026-09-25)
- WithPrefixAndSuffix: resting render correct (label, £, input, clear, one
  bezel); a11y tree shows host generic (no role), named textbox + button.
- Mouse click into input: bezel border brightens, outline none,
  no `data-focus-visible` (computed-style verified) — FI-CSS-05 mouse path.
- Invalid: red bezel + error text. Disabled: dimmed bezel. Both correct.
- MCP-browser Tab did not move focus (MCP focus limitation, not a Field
  finding); keyboard ring is CT-proven by FI-CSS-05 (real Tab, 2px solid
  ring on Field, transparent on Input).
- Console: 0 errors; 4 warnings are Book-shell css() misses (canvas chrome),
  unrelated to Field.
- All 8 new CT snapshot baselines eyeballed: sane (embed rows, state stack
  incl. amber warning, amount invalid, compounds incl. double-bezel error
  fixture, 4-fixture surface board, date compound, token picker).

## What was ported (Field dir only)
- `Field.tsx`: runtime strip of the prohibited ARIA surface (`role`,
  `aria-invalid/disabled/readonly/required/errormessage`) + pinned
  `data-reference-field` / `data-status` after the spread. Quarantine logic,
  zero visual impact for valid callers (type Omit already blocked TS).
- `Field.test.tsx` (new): FI-TYPE-01 compile fixture (StyleProps + 7
  `@ts-expect-error` assertions). tsc clean for Field dir (4 pre-existing
  errors elsewhere: Slot.test, playwright/ct gallery types — untouched).
- `Field.story.tsx`: 8 new contract fixtures (existing 2 byte-identical):
  ProhibitedProps, EmbeddedChrome, StateChrome, Amount, CompoundEmbed,
  SurfaceRecipe, DateCompound, TokenPicker.
- `__e2e__/Field.ct.spec.ts`: 3 tests -> 20. DOM-01/02/03 split into
  dedicated titles; CSS-05 extended (ring-on-Field-not-Input); 14 new FI
  titles (CSS-01/02/03/04/07/08/09/10, SURF-01, LAY-01, COMP-01,
  COMP-02-bezel, COMP-03, COMP-04-bezel-subset); 8 new snapshot baselines.
- `SPEC.md`: honest accounting — 19/20 `[x]` (2 bezel-subset scoped),
  FI-CSS-06 `[ ]` blocked, FI-DOM-04 dropped, focus polyfill resolved.

## Deliberately NOT ported (SUSPECT / out of scope)
- Shared-theme edits (`field.ts`, `focus-visible.ts` — recon Exhibit 3):
  focus-ring suppression + propagation narrowing. Unported; theme files
  outside my touch scope regardless.
- FI-CSS-06 as written: FAILS on current theme (tracker sets
  `data-focus-visible` on the Field host for any keyboard-focused
  descendant, so nested-button focus rings the bezel). Needs a theme-crew
  propagation change. Enshrining current behavior as contract would be wrong.
- FI-COMP-04 ring-on-opener/chip step: same theme blocker.
- FI-COMP-02 fill+Enter publish + FI-COMP-04 commit/remove flows:
  DateField/Combobox-owned per TESTS.md "Owned elsewhere".

## Surprises
- Bezel `border-color` transitions over 150ms: quarantine's 100ms
  post-toggle waits read mid-flight colors (flaky equality/hue asserts).
  Re-targeted to 300ms waits + mount settle waits; full suite now stable.
- First CT run auto-wrote the 8 new baselines and failed those tests
  ("snapshot doesn't exist, writing actual"); second run verified them.
  Existing 9 baselines compared strictly, never rewritten.
- One combined `pnpm agentct Field` run reported "Unit: failed | 0 tests"
  while E2E was 28/28; immediate re-run green (Unit 1/1, E2E 28/28).
  Transient runner/reporting flake, likely daemon contention with other crews.

## Handoffs / follow-ups
- Theme crew: FI-CSS-06 needs `setupFocusVisible` propagation narrowed so
  keyboard focus on nested buttons does not set Field `data-focus-visible`
  (quarantine did this inside SUSPECT theme edits — re-derive cleanly).
  Unblocks FI-CSS-06 + COMP-04 ring assertions.
- DateField crew: FI-COMP-02 typing/publish sessions. Combobox crew:
  FI-COMP-04 commit/remove flows.
- Human: 8 new snapshot baselines recommended by UX — confirm at commit
  review (see verdict + commit-ready arc above).

COMPLETE
