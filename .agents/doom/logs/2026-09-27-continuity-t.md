---
date: 2026-09-27
cycle: continuity-01
module: atomic/stylesheet/system_layers(tokens)
theories_spent: 1
verdict: break-found
---

# R-valued token mints raw `1r` into `@layer tokens` silently

## Hypothesis

Theory 1 (spent, RED): a token defined as an r-value — `spacing.4 =
"1r"`, a spacing alias to rhythm — composes two pinned behaviors:
`1r` lowers to `var(--spacing-root)` in utilities (ATM-RHYTHM-01)
and keyframe values resolve `r` through the unit+rhythm+token chain
(`resolve_keyframe_value`). But `@layer tokens` emit
(`css_token_value`, `stylesheet/system_layers/mod.rs:286-295`) only
expands whole-value `{brace}` aliases and prints everything else
verbatim. Result, verified firsthand through REAL `compile()`:
the sheet mints `--spacing-4: 1r` — `1r` is engine grammar, not a
CSS unit, so every `padding: var(--spacing-4)` substitution is
guaranteed-invalid and dropped by the browser — with zero
diagnostics, a live plan, and the utility
(`.rvalue-spacing__p_4 { padding: var(--spacing-4); }`) served as
healthy. Silent missing paint on fully static authorship. Red test:
`/tmp/doom-continuity-t1-rvalue.mts` (exit 1; fails iff raw
`--spacing-4: 1r` is minted).

Free research, not spent: doom-log search before hunting showed no
r-value-token or opacity-on-non-color coverage; the wave3
`color={4}` → `color: 4px` observation was deliberately not
re-pursued as explored ground. Unexplored gaps left for
scheduling: opacity modifiers on non-color tokens
(`{spacing.4/50}` → `color-mix` over a length var, silent) and the
thin token-emit side of the rhythm contract generally.

## Verdict

`break-found`. Repro: `/tmp/doom-continuity-t1-rvalue.mts`
(blind-runnable: `cd packages/reference-rs &&
./node_modules/.bin/tsx /tmp/doom-continuity-t1-rvalue.mts`;
prereq `pnpm agentrs b` only if the binding is stale). Violated
contract: ATM-RHYTHM-01 (`1r` lowers to `var(--spacing-root)`) plus
the tokens README Must-not ("Fail closed ... only when the author
wrote a raw CSS value" — the author wrote engine grammar the
compiler resolves everywhere else, not raw CSS), with keyframe
emit as the in-tree proof that token-adjacent values resolve `r`.
Severity: user-facing, silent wrong paint (a whole spacing scale
drops in the browser with nothing in diagnostics) on fully static
authorship. No fix direction pinned: resolving `r` at token emit
like keyframes, or refusing r-valued slots with a diagnostic, both
close it.
