# Crew brief — ARC2 — strengthen ARC1 tests + runtime↔static seam (font-weight-runtime-1008)

Crew lead on a captain mission. Implement **Arc 2 only**. Do **not** commit. Do
not touch files outside your scope. Append one progress entry to
`.agents/missions/font-weight-runtime-1008/LOG.md`. Report files changed + raw
test output.

## Context

Arc 1 (`977593fc6`) added `packages/reference-neo/src/runtime/css/scope.ts` and
wired `applyFamilyScope(queries)` into `css.ts`. The Oracle arc review
(`reports/ARC1.review.md`) cleared the product change but flagged three
test-adequacy gaps (ARC1-1..3) and required an Arc 2 seam test. Read that report
first.

## Tasks

1. **ARC1-1 (P2) — make the base-fallback integration case discriminating.**
   In `packages/reference-neo/src/runtime/css/css.test.ts`, the case
   `css({fontFamily:'sans', _hover:{weight:'normal'}})` asserts `hover:font-weight_400`,
   but `sans.normal` == 400 == the keyword, so it passes pre-fix. Switch to a
   discriminating pair, e.g. `css({fontFamily:'serif', _hover:{weight:'normal'}})`
   → `hover:font-weight_373` (and/or `sans` + `thin` → 200 under `_hover`).
2. **ARC1-2 (P3) — make the conflict case distinguish decline from last-wins.**
   Replace/augment the sans+mono `thin` case with a three-family conflict where
   all outcomes differ: `serif`+`mono`+`normal` → **400** (decline), whereas
   first-wins would give 373 and last-wins 393.
3. **ARC1-3 (P3) — pin the remaining responsive shapes.** In the same file, add
   pins for the F3 interim (string-only scoping): (a) weight **array**
   (`weight: ['thin']`), (b) object+object (`fontFamily:{...}, weight:{...}`),
   (c) font-object + string-weight. Mark them clearly as KNOWN-DIVERGENT interim
   behavior with the same `// follow-up:` note, or explicitly defer (a)-(c) into
   task 4's seam as KNOWN-DIVERGENT — your call, but every choice must be
   visible in a test or in the seam spec, not silently dropped.
4. **Arc 2 seam test — runtime equals static.** Extend the `NEO-NAMER-02`
   case world so it pins runtime classes against the static `ATM-COND-05` pins
   (`sans.thin`→200, `serif.normal`→373, `mono.normal`→393) plus: all six
   keywords × the three families, lone keyword weights, conflicting families,
   conditionals, the dynamic-string boundary (O5: runtime scopes a variable-held
   `'thin'`; static authored plans stay bare), and — as KNOWN-DIVERGENT — the
   F3 responsive shapes from task 3. Inspect
   `packages/reference-neo/tests/cases/namer/NEO-NAMER-02/` for the existing
   world/spec shape and follow it (world `src/fonts.ts` gains serif/mono scales,
   `src/app.ts` gains weight cases, `specs/corpus.spec.ts` asserts the classes).
   Follow the `agent-neo` skill for the case/Playwright loop and its `q` gate.

## Constraints

- No product behavior change; tests and case fixtures only. Do not edit
  `scope.ts`, `css.ts`, or `lower.ts`.
- `pnpm agentneo q` must stay 0 errors; note any warn-line crossings.
- Do not commit. Report: files changed, exact commands, raw output, deviations.
