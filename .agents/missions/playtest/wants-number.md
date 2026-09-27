# wants-number crew log

Status: **COMPLETE** (branch `reference-system`; no commits — captain commits)

Scope: `packages/reference-lib/src/components/NumberField/` only (+ this log).
Deps: B-19 input session landed; used as the commit boundary for both wants.

## Result

- **W-02 `commitBehavior` — DONE.** `commitBehavior?: 'snap' | 'validate' |
  'none'` (default `'none'`), `onInvalidCommit?(attempted, reason)`.
  `step={1}` + snap: type 2.5, commit → 3, single `onChange`. Ties
  round-half-up (`-2.5` → `-2`). Validate reverts + reports, no `onChange`.
- **W-25 `formatOptions` — DONE.** `formatOptions?: Intl.NumberFormatOptions`;
  clean display is `Intl.NumberFormat(locale, formatOptions)`; dirty draft
  stays verbatim; commits are plain numbers (percent ÷100, ‰ ÷1000);
  `null` ↔ `''`; percent default step 0.01; bad locale/options fail fast.

## Files changed (all in `packages/reference-lib/src/components/NumberField/`)

- `NumberField.tsx` — props, RAC-ported snap math + option equality,
  locale commit parser, Intl display, commit pipeline, format-change effect
- `NumberField.test.tsx` — 23 new unit tests (W-02 ×13, W-25 ×10)
- `types.test.tsx` — new-props type contract (+1 test)
- `NumberField.story.tsx` — Snap/Validate/Currency/Percent fixtures
- `__e2e__/NumberField.ct.spec.ts` — 4 new CT specs (no new snapshots)
- `NumberField.book.tsx` — Snap/Validate/Currency viewing stories
- `NumberField.md` — Proposed API honesty update (third enum value,
  `onInvalidCommit`, `'none'` default)

## Proof

- `pnpm --dir packages/reference-lib sync` — clean, no stylesheet diff
- `pnpm agentct NumberField --unit` — **58/58 passed** (0 failed)
- `pnpm agentct NumberField --e2e` (React 19) — **23/23 passed** (0 failed),
  all pre-existing visual snapshots held (no drift)
- `tsc --noEmit` — zero new errors (2 NumberField `data-pressed` errors are
  pre-existing on HEAD)

## Flags for HQ (adjudication needed)

1. **Snap lattice follows RAC, contradicting the TESTS.md freeze.** RAC is
   min-anchored with a lattice-clamped max (min 0/max 10/step 3: exact `10`
   and `13` both commit `9`); the freeze demands zero-anchored +
   endpoint preservation (`10` → `10`, NF-MATH-03/10/11/12/15). Mission
   order said RAC-exact, so RAC won; freeze docs need a ruling.
2. **Round-half-up ties** (signed-off) differ from BOTH RAC (sign-based)
   and the freeze (away-from-zero) on negative midpoints (`-2.5` → `-2`).
3. **Validate rejects** (revert + `onInvalidCommit`, no `onChange`) per the
   signed-off spec; RAC validate publishes and marks invalid instead.
4. Tie-break priority `out-of-range` > `off-step` when both apply (chosen,
   tested, undocumented upstream).
5. **Stepping unchanged** (no RAC `safeNextStep` directional snap);
   commitBehavior governs typed commits only. Steppers still clamp-step in
   validate mode.
6. Commit parser is deliberately modest: ASCII digits, strict 3-grouping,
   `$`/`%`/locale-punct tolerant; currency codes, units, non-ASCII digits,
   accounting parens, compact notation stay invalid (full NF-PARSE deferred).
   Corollaries: `none` mode now parses `"1,000"`; `"1e999"`/`"Infinity"`
   revert in all modes (was: clamp/publish); de-DE `"2.5"` reverts (strict
   locale punctuation, never reinterpreted).
7. Display-reparse at commit in snap/validate (RAC parity): authored
   precision can move values (step 0.1 + maxFracDigits 0: `2.5` → `3`).
8. Clean display is always Intl (grouping ≥ 1000); programmatic `-0`
   renders `"0"` (NF-MATH-14 preserved). `inputMode` stays `"decimal"`
   (grammar-derived modes deferred).
9. "Editing shows raw" read as draft-verbatim (no focus-triggered raw
   switch), preserving NF-EDIT-01.
10. Acceptance clause "uncontrolled + controlled both" is N/A — the engine
    is required-controlled (FEATURES #1 landed).
11. `onInvalidCommit` contradicts TESTS.md NF-TYPE-02 freeze text ("reject
    commit callbacks"); signed-off W-02 wins, freeze text needs updating.
