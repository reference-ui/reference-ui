---
date: 2026-09-19
cycle: wave1
module: atomic/extract/fold
theories_spent: 1
verdict: break-found
---

# Unbound names fold through the project bag, killing live arms

## Hypothesis

Gap: per-file scope tables (`ScopeChain`) resolve identifier uses from the
use-site scope outward, but genuinely unbound names fall back to the merged
project-wide name bag (`LocalConstants`, all files' consts — including
function-local declarators, since `ConstCollector` visits nested bodies).
Value positions scooping the bag are a safe superset (over-mint). Decision
positions are not: `fold_test` and `fold_logical` read the same
`Scoped::scalar_leaves`, so a const that is not in scope at the use site
becomes a wrong fact — dead-arm elimination fires on another file's value.

Red test (Theory 1, spent): two virtual sources through `compile()` —
`src/a.ts` with `export const flag = true`, `src/b.ts` with
`css({ mt: flag ? '2r' : '4r' })` where `flag` is unbound. Asserted both
arms mint. Result RED: wants hold only `mt=2r`, with
`ATM-I-DEAD-BRANCH "dead branch '4r' for prop 'mt' (test folds to true)"`
pointing at `src/b.ts`. Proven at the JS seam via a temporary vitest file
run under `pnpm agentrs v` (failed as expected, file deleted after), and
kept as the blind repro below. Native binary rebuilt first via
`pnpm agentrs b` (the checked-in `darwin-x64`/`darwin-arm64` binaries were
stale vs Sep-19 sources).

Controls: file B alone keeps both arms (test stays open — correct); a
same-scope bound `const flag = true` folds to `2r` (intended); a single
file with `const flag = true` in a *sibling function scope* also leaks
(bag holds nested declarators, use site is unbound). Same root cause
breaks `||` worse: unbound `flag || '2r'` plus file A's
`const flag = 'x'` mints bogus `mt='x'` and drops live `'2r'`.

## Verdict

`break-found`. Repro: `/tmp/doom-wave1-extract-repro.mjs`
(`node /tmp/doom-wave1-extract-repro.mjs`, exit 1 while broken; prereq
`pnpm agentrs b`). It asserts the `4r` want, the `mt_4r` stylesheet rule,
and the `mt:4r` runtime-map entry — all absent.

Violated contract: `walk_conditional`
(`packages/reference-rs/modules/atomic/src/extract/expressions/walk/branch.rs`)
eliminates the dead arm on the premise "the runtime picks the same arm
every time" — false when the test name is unbound at the use site (a
runtime global may pick the eliminated arm). End state is the README P0:
"Ghost class (runtime asks for an atom the sheet never printed) is a P0"
(`packages/reference-rs/modules/atomic/README.md`) — the sheet prints only
`.mt_2r` and the map holds only `mt:2r`. The bag fallback for unbound names
is documented as transitional (`scope/mod.rs`: "siblings retire it") for
resolution, but nothing authorizes foreign consts as fold facts.

Severity: user-facing, silent wrong CSS. Trigger is plausible ambient
globals (`__DEV__`, `DEBUG`, injected build flags) colliding with any
same-named const anywhere in the project — adding an unrelated const can
change another file's emitted stylesheet with only an `info` diagnostic.
Fix direction needs no architecture: folds must not treat unbound-name
bag hits as constant (value scoop may stay a superset).

Note: doom log was empty at search time (first hunt; a sibling wave-1 log
landed concurrently). Hunt stopped at one candidate per protocol; 2
theories unspent.
