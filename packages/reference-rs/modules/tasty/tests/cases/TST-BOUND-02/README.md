# TST-BOUND-02 — a .d.ts nested 5,000 Array levels deep is refused with TST-W-PARSE-ERROR while its sibling is emitted

`input/index.ts` alone is the station input, built in process. The bound is the deep declaration: `spec.ts` writes
`deep.d.ts`, a type alias that nests `Array<` 5,000 levels deep, beside `index.ts` in a temp project it owns, and
builds that project through `buildTasty` in a child process (`build-deep.mjs`) under `runIsolated`. The kill budget
is 30 s and the budget through `expectBounded` is 2000 ms.

Type lowering in tasty is quadratic in the nesting depth: a 1,000-level alias builds in about 0.7 s, and the unguarded
5,000-level alias runs past 90 s. The pre-scan counts `<` after an identifier in TypeScript files, so `Array<` nests
the same way `(` does, and it refuses `deep.d.ts` before Oxc sees it. The build must report exactly one
`TST-W-PARSE-ERROR` that names `deep.d.ts` at line 1 with the message `nesting deeper than 1024 levels at line 1; split or flatten the deeply nested expression`,
and must still emit `Box` from `index.ts`.

Siblings: TST-BOUND-01 (display members terminate on cyclic and growing heritage within 2 s), TST-AUD-01 (the
audit's duplicate-name and budget fixtures).

> Search terms: nesting depth, pre-scan, Array generic, quadratic lowering, parse refusal, located parse error, sibling emitted, bounded build
