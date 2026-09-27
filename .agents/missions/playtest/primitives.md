# Primitives crew log — playtest mission

Status: COMPLETE (2026-09-27)
Branch: reference-system (never switched; never committed — captain commits)

Scope: text primitives + Tooltip + Toast + primitive Button ONLY:
`packages/reference-lib/src/components/{Tooltip,Toast}` (+ colocated tests/stories)
and the primitive/theme layer (`packages/reference-lib/src/core/theme/primitives`).
No other component dirs.

Bugs: B-09 (+W-03), B-37, B-40.

## Assigned bugs (Part 1)

| ID | Bug | Initial read |
|---|---|---|
| B-09 | Span in Tooltip.Content invisible (dark-on-dark) | LIVE in src: `baseTypography` pins `color: design.text.base` (dark); `.ref-span` spreads it, so Span ignores Tooltip.Content's light `design.primary.foreground`. Plain strings inherit correctly. Fix per W-03: inherit/default legible with zero overrides, or documented+verified token. |
| B-37 | Toast close × sits half-outside toast corner | LIVE in src: `toastStyles.ts` `[data-corner]` = `top:0;left:0;translate(-35%,-35%)`, straddles the corner. Trivial. Decide: move fully inside vs document-as-intentional. |
| B-40 | Primitive Button full-width block by default | UNCONFIRMED: src `.ref-button` is already `display:inline-flex` with no width — need live repro to find where full-width comes from (stale consumer CSS? flex-stretch parent? generator default?). |

## Decisions

- B-09/W-03: fix in the primitive (`.ref-span` → `color: inherit`, field.ts precedent),
  not in Tooltip. Sibling pinners (Div/P/B/Em/…) intentionally left for HQ follow-up.
- B-37: SPEC (TO-RIVAL-CLOSE/TO-DEF-DEFAULT/TO-RIVAL-DIR) **mandates** the overlapping
  corner badge ("not an icon inside the padding") — the straddle was intentional AND
  filed as a bug. Fix = inline-trailing 20px circle, fully inside the card (only
  defect-free reading: inside-top-left would cover text; fully-outside badge would
  collide with stacked neighbors). Requires amending 3 SPEC rows + 2 tests; snapshot
  drift goes to HQ for human-gated approval. `data-corner` hook name kept for
  back-compat. Fully-outside badge and keep-and-document both rejected (recorded in
  session notes).
- B-40: no src defect found (`.ref-button` is `inline-flex`, no width, since history;
  both apps' final screenshots show normal inline buttons). Diagnose = flex-column
  stretch in an intermediate app iteration (standard CSS, native buttons do the same).
  Action: live regression test proving inline shrink-to-fit parity with native
  `<button>`; report as not-a-defect with proof unless the test surprises us.
- Scope note: `components/Button/` (story+e2e only, no component src, no other owner)
  treated as in-scope "primitive Button" for the B-40 test home. Fix (if any) lives
  in the theme layer.

## Work log

- 2026-09-27: opened log (IN PROGRESS). Read PLAYTEST-REQUIREMENTS.md Part 1 entries + settings/sched FRICTION.md diaries. Starting repros.
- Baselines green: Tooltip E2E 13/13 + unit 3/3; Toast E2E 60/60 + unit 52/52 (React 19).
- B-09 repro confirmed: settings shot-tooltip.png shows the black-bar tooltip; src pins
  `design.text.base` (gray-950 light / gray-50 dark) while default Tooltip.Content is the
  inverted `design.primary` chip → invisible in BOTH modes.
- B-37 repro confirmed: settings shot-tooltip.png + gate7-close-button.png show the ×
  straddling the top-left corner (translate(-35%,-35%)).
- B-40: sched dialog-open2.png + settings shots show normal inline buttons; src has no
  full-width mechanism. Proceeding to live regression test.
- TDD red confirmed pre-fix: B-09 FAIL (span oklch(0.13…) vs chip oklch(0.985…) —
  diary's exact values), TO-RIVAL-CLOSE FAIL (close x=414 vs card x=419, outside),
  B-40 PASS (already correct).
- Fixes: (1) B-09: `.ref-span` → `color: inherit` in document.ts + `ref sync`
  (compiled CSS verified); (2) B-37: `[data-corner]` → static inline-trailing circle,
  RTL flip rules deleted; amended SPEC rows TO-RIVAL-CLOSE/TO-RIVAL-DIR/TO-DEF-DEFAULT.
- B-09 helper fix: computed colors come back as oklch, not rgb — spec contrast helper
  now converts oklch→linear-sRGB properly.
- TO-RIVAL-DIR flaked once in isolation (missing visibility wait before measuring —
  pre-existing race, sibling test already had the wait); added
  `await expect(close).toBeVisible()`, stable since.
- Full-page snapshots pass within the 2% tolerance (moved 20px close ≈0.2% of pixels)
  so NO snapshot updates were needed or taken; baselines still depict the old corner
  badge (flagged for HQ below).
- Visual proof: capture screenshot of new inline close
  (.reference-ui/captures/Toast_Basic_toast-inline-close.png) — 20px circle, trailing,
  centered, fully inside, no text overlap. Videos are not retained in this env (only
  screenshots persisted), so motion review = geometric/colorimetric assertions.
- One transient unnamed Toast failure in an intermediate full run (59/1), green 60/60
  on immediate re-run; final state green. Likely load flake under concurrent crews.

## Verdicts

| ID | Result | Proof |
|---|---|---|
| B-09 | FIXED (W-03 inherit route) | New CT B-09: span color == chip fg + contrast ≥ 4.5 (real computed oklch); new unit document.test.ts; compiled `.ref-span{color:inherit}` verified |
| B-37 | FIXED (spec-amended) | TO-RIVAL-CLOSE + TO-RIVAL-DIR assert 20px + full containment + trailing side (LTR+RTL); capture screenshot verified |
| B-40 | NOT-A-DEFECT (regression-locked) | New CT B-40: bare Button is `inline-flex`, shrink-to-fit (< ½ of 600px container), same line as native `<button>`; passes on unmodified src |

## Suites (React 19, final state)

- Tooltip: E2E 14/14 (13 baseline + B-09), unit 3/3 — Failed: 0
- Toast: E2E 60/60 (incl. amended CLOSE/DIR), unit 52/52 — Failed: 0
- Button: E2E 7/7 (6 baseline + B-40), unit n/a (0 exist) — Failed: 0
- Primitives: E2E 4/4 (typography snapshot safety for Span change) — Failed: 0
- Theme primitives unit (`pnpm agent vt …/theme/primitives`): 12/12
  (document 1 new + button-variants 6 + focus-visible 5) — Failed: 0

## Files changed (10; no snapshots, no commits)

- packages/reference-lib/src/core/theme/primitives/document.ts (B-09 fix)
- packages/reference-lib/src/core/theme/primitives/document.test.ts (new, B-09 unit)
- packages/reference-lib/src/components/Tooltip/Tooltip.story.tsx (SpanInDefaultContent)
- packages/reference-lib/src/components/Tooltip/__e2e__/Tooltip.ct.spec.ts (B-09 test)
- packages/reference-lib/src/components/Toast/toastStyles.ts (B-37 fix)
- packages/reference-lib/src/components/Toast/SPEC.md (3 contract rows amended)
- packages/reference-lib/src/components/Toast/__e2e__/Toast.ct.spec.ts (CLOSE/DIR new contract + DIR wait)
- packages/reference-lib/src/components/Button/Button.story.tsx (ButtonBlockDefault)
- packages/reference-lib/src/components/Button/__e2e__/Button.ct.spec.ts (B-40 test)
- .agents/missions/playtest/primitives.md (this log)

## Flags for HQ

1. B-37 overturns 3 FROZEN Toast contract rows (TO-RIVAL-CLOSE/TO-RIVAL-DIR/
   TO-DEF-DEFAULT: "overlapping corner button, not an icon inside the padding").
   Rows amended in-diff; needs HQ eyes at commit review.
2. Toast baselines (gate7-close-button, default-toast-open, basic-stack-*,
   gate6-modal-a-paused-toast, gate7-rtl-layout) still depict the old corner badge;
   all pass within 2% tolerance. Optional human-gated `--update-snapshots --confirm`
   refresh — not taken (no approval, nothing fails).
3. Sibling color-pinning (Div/P/B/Em/Strong/…) unchanged — same invisible-text class
   on dark surfaces (e.g. `<Div>` inside Tooltip.Content still pins dark). Recommend
   follow-up bug; Span-only was the minimal reported repro.
4. B-40 closed as not-a-defect (see Verdicts). If HQ has a repro context beyond
   flex-column stretch, reopen with the context.
5. Env notes: CT videos not retained here (screenshots only); one transient unnamed
   Toast 59/1 between green runs (concurrent-crew load suspected); Book HMR storm
   from another crew's icon churn made a second capture impossible (Tooltip Span
   eyeball skipped — computed-color proof stands).
