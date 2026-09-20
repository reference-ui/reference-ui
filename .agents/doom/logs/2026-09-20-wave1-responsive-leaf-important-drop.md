---
date: 2026-09-20
cycle: wave1
module: atomic/extract/harvest
theories_spent: 1
verdict: break-found
---

# Responsive-leaf `!` silently serves the plain class

## Hypothesis

Theory 1 (spent, RED): leaf `!` markers inside responsive shapes are
honored by the want walker but dropped by the plan capture and
unexpressible at runtime, so static `width: { base: '50px!' }` paints
plain `width: 50px` with zero diagnostics at any level. Chain,
verified firsthand through REAL `compile()` + REAL neo runtime:
want `(width,"50px",[base],important=true)` per
`extract/expressions/object/entries.rs:76-80` (per-leaf
`split_important_flag`, Forge S5-2); plan value `{"base":"50px"}`
`important:false` per `extract/expressions/ast_value.rs:219-222`
(`convert_object` recurses through `ast_to_json_value` and discards
every nested flag); plan points at the plain `__w_50px` class while
the sheet also mints an orphan `__w_50px\!` nothing references;
runtime `cleanResponsiveObject`
(`packages/reference-neo/src/runtime/css/css.ts:139-158`) strips the
leaf and "always runs non-important", so the query HITS the plain
plan — no miss warning either. Proof stays silent because analysis
predicts the stripped key (`nested_shapes_stay_raw`), which is
present: no layer checks importance. Red test:
`/tmp/doom-wave1-resp-important-repro.mts` (exit 1; fails iff
compile-silent + runtime-silent + served class lacks `!`).

Free research, not spent: responsive-ARRAY `!` (`padding: ['1!']`,
`['1!','2']`) reaches the same split but Error Correct diagnoses it
honestly (`ATM-W-MISSING-STYLE-PLAN` + dev miss warning) — correct
signal, not filed. Array-in-object (`{ base: ['1!'] }`) mints zero
plans with a doubled `["base","base"]` want-when — diagnosed miss,
noted as an observation, not the claim. Doom-log search before
hunting showed only the percentage-mint, bag-leak, and ladder-memo
finds; O4-F5 fodder (nested-`!` unreachable plans) pointed at the
gap but named the diagnosed array case, not this silent one.

## Verdict

`break-found`. Repro: `/tmp/doom-wave1-resp-important-repro.mts`
(blind-runnable: `cd packages/reference-rs &&
./node_modules/.bin/tsx /tmp/doom-wave1-resp-important-repro.mts`;
prereq `pnpm agentrs b` only if the binding is stale). Violated
contract: SPEC "Authored `!` / `!important` suffixes on string
literals must set `Want.important`" (ATM-LEAF-09) plus per-leaf
importance as the IR contract (ATM-SITE-64: per-arm `!` mints
`p_2r!` beside plain `p_3r`) — here the want IS important and the
`!` class IS minted, yet the lookup silently resolves to weaker
CSS. Severity: user-facing, silent wrong paint on fully static
authorship (a `!` the author can see in the sheet, unreachable at
runtime), plus orphan-`!`-class sheet bloat per site. No fix
direction pinned: honoring importance through plans/runtime or
refusing `!` in responsive leaves with a diagnostic both close it.
