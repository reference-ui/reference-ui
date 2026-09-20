---
date: 2026-09-20
cycle: wave3
module: atomic/resolve/tokens
theories_spent: 1
verdict: break-found
---

# Negated braced token mints invalid `-var(...)` CSS silently

## Hypothesis

Theory 1 (spent, RED): the composed spelling `mt: '-{spacing.4}'`
combines two pinned behaviors — bare negation calc-wraps
(`-4` → `calc(-1 * var(--spacing-4))`, ATM-TOKEN-07) and braced
refs resolve (`{spacing.4}` → `var(--spacing-4)`) — but
`resolve_negated_token` (`resolve/tokens/mod.rs:262-270`) looks up
the still-braced `{spacing.4}` against the dictionary, misses, and
falls through to brace interpolation, which pastes the literal `-`
in front of the expansion. Result, verified firsthand through REAL
`compile()` + REAL neo runtime: the sheet mints
`margin-top: -var(--spacing-4)` — invalid CSS, dropped by every
browser — with zero diagnostics, a live plan, and the broken class
served with no runtime miss warning. Silent missing paint on fully
static authorship. Red test:
`/tmp/doom-wave3-neg-brace-repro.mts` (exit 1; fails iff
invalid `-var(...)` minted + compile-silent + served with no miss;
both half-spelling controls green).

Free research, not spent: `color: 4` (bare number on a color prop)
warns `ATM-W-UNKNOWN-COLOR` correctly yet mints `color: 4px` — a
fabricated unit — where the string twin `'4'` warns and passes
through verbatim (`color: 4`); the `from_number` path bypasses the
`accepts_bare_number` "numbers never paint on colors" rule the
string path honors. Warned, not silent — noted as an observation,
not the claim. Doom-log search before hunting showed no negation
or brace-composition coverage; wave-1/2 ground (responsive-leaf-!,
unknown-prop silence, tasty scan, canon join, styletrace
body-destructure, star nested-unresolved) untouched by this gap.

## Verdict

`break-found`. Repro: `/tmp/doom-wave3-neg-brace-repro.mts`
(blind-runnable: `cd packages/reference-rs &&
./node_modules/.bin/tsx /tmp/doom-wave3-neg-brace-repro.mts`;
prereq `pnpm agentrs b` only if the binding is stale). Violated
contract: ATM-TOKEN-07 (negated scale tokens calc-wrap) composed
with braced-ref resolution, plus the tokens README Must-not
("Fail closed: diagnostic + `Raw` / passthrough only when the
author wrote a raw CSS value" — the author wrote neither `-var()`
nor raw CSS; the engine fabricated it). Severity: user-facing,
silent wrong paint (a dropped declaration the author cannot see
except in DevTools) on fully static authorship. No fix direction
pinned: calc-wrapping the negated expansion or refusing `-{...}`
with a diagnostic both close it.
