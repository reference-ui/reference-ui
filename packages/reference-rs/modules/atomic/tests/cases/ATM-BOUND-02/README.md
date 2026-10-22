# ATM-BOUND-02 — a file nested 300,000 levels deep is refused with a located ATM-E-PARSE beside its siblings

`input/` holds two styled siblings, `src/red.ts` and `src/blue.ts`, and compiles in process. The bound is the
deep file: `spec.ts` copies `input/` into a temp project it owns through `withTempDir`, adds `src/deep.ts`, which
nests one `css()` colour value 300,000 parentheses deep on line 2, and compiles that project through `driver.mjs`
in a child process under `runIsolated` (kill budget 30 s, budget 2000 ms through `expectBounded`).

The pre-scan refuses `deep.ts` before Oxc sees it. The compile must report exactly one `ATM-E-PARSE` that names
`src/deep.ts` at line 2 with the message `nesting deeper than 1024 levels at line 2`, must emit no class from the
deep value (`color:green`), and must keep both siblings' classes.

The depth is sized past the current build's limit. On the exports' 256 MiB thread the unguarded compile survives
5,000 and 160,000 levels with no signal and no `ATM-E-PARSE`, and dies with SIGILL from 200,000 levels, so at
300,000 the red run fails by signal and the green run fails nothing.

Siblings: ATM-BOUND-01 (a 2,000-deep value compiles in a child process), ATM-BOUND-03 (the same temp-project pattern
for an export-star clique).

> Search terms: nesting depth, pre-scan, parse refusal, located parse error, stack overflow, deep parentheses, bounded compile, ATM-E-PARSE, sibling isolation
