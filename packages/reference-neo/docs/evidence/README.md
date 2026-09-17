# Evidence — the research behind `PLAN.md` Part Three

Read-only findings gathered on 2026-09-17 by nine scouts, each answering one
question and writing one report. Nothing here is a contract; every report
cites the files and tests it read so a claim can be re-checked, and the
campaign plan (`packages/reference-neo/PLAN.md`) cites these reports instead
of re-probing. The folder is called `evidence` rather than `research` because
the repository root ignores every `research/` directory.

Before you plan, spec, or build anything in Neo, read the executive summary
of the reports that touch your group. Every number in them came from `rg`
and the command is stated. Family tags (`TOKEN`, `COND`, `RESP`, `MERGE`,
`RECIPE`, `GLOBAL`, `STATIC`, `SITE`, `TYPE`) match the group names in
`PLAN.md` §8. Where a report says Reference *differs on purpose* from Panda,
that is a decision the plan records in §3; do not "fix" it toward Panda.

## The reports

- `neo-state-2026-09-17.md` — what exists in `src/` and `tests/`, how the
  harness selects, builds, syncs and asserts, how healthy it is, and how long
  a run takes (swarm calibration).
- `lib-sheet-styles-css.md` — the working library's 27k-line generated
  stylesheet: layer order, every feature family with counts, the twelve
  hardest families to reproduce, the ten weirdest rules, implications.
- `lib-sheet-global-css.md` — what Panda's global cssgen file is, five
  traces from author call to emitted CSS, the reset, load order, and the
  gap list for Neo's `globalCss()`.
- `generated-folder-shape.md` — what consumers actually import from the
  generated packages, the type surface, Neo's delta today, and the ten
  filenames, exports, and DOM attributes that must not regress.
- `core-api-parity.md` — core's author and runtime surface against Neo's,
  module by module; the panda-isms to rename at the boundary; the ten open
  questions that `PLAN.md` §3 answers.
- `atomic-claims.md` — what the Rust engine claims, how each claim is proven
  (goldens, not browsers), the seam Neo actually calls, the colour-mode
  attribute conflict with counts, and the P0/P1/P2 list of claims with no
  browser proof.
- `panda-v1-core-corpus.md` — Panda v1 `packages/core` tests mined by
  family with inputs and expected CSS, 61 case proposals, out-of-scope table.
- `panda-v1-tokens-types-corpus.md` — token dictionary, generator, shared,
  and preset-base tests: refs, semantic islands, composites, CSS var naming,
  typegen unions, runtime normalisation.
- `panda-v1-parser-config-corpus.md` — parser, extractor, config, node, and
  codegen tests: the extraction boundary, host detection, config merging,
  breakpoints, and the generated-folder comparison.
- `coverage-lib.md` — W0 audit: every artifact type under lib's
  `.reference-ui/`, its consumer import path, and which Neo case covers it.
- `coverage-core-neo.md` — W0 audit: core's and Neo's output trees against
  the PLAN §4.1 inventory, row by row with reserved case ids.
- `coverage-imports.md` — W0 audit: every consumer import specifier across
  Book, CT, matrix, and lib tsconfig, mapped to §4.1 targets.
- `coverage-map.md` — the converged map: verdict per artifact type, §8 row,
  and the W1 starting input. Written by the captain from the three audits.

## Refreshing a report

Re-run the scout prompt in `PLAN.md` §10.1 with the same question, overwrite
the file, and put the new date at the top. Add a report only when the captain
has stated a question the existing reports do not answer.
