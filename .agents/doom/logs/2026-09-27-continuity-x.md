---
date: 2026-09-27
cycle: continuity-01
module: atomic/namer(when)+neo/runtime(miss)
theories_spent: 1
verdict: break-found
---

# Unknown-condition misses serve "" with zero diagnostic

## Hypothesis

Theory 1 (spent, RED): condition-position misses skip the miss path.
`lowerConditions` (`modules/atomic/js/namer/shape.ts:157-166`) refuses
an unknown `when` entry by dropping the whole want, so `name()`
returns `[]`, `css()` records zero classes, and `reportStyleMisses`
(`packages/reference-neo/src/runtime/css/css.ts`) has no candidate to
probe — the declaration vanishes to `""` in total silence. Unknown
PROPS take the honest path the namer documents (`classPrefix`:
"the oracle never kebabs on a miss" — `frobnicate:red` mints
`frobnicate_red` and warns); unknown CONDITIONS take neither half.
The red test (`/tmp/doom-continuity-x-condition-miss.mts`, exit 1)
proves it through REAL `compile()` + REAL neo runtime over a stub
document carrying the REAL compiled utilities selectors: hit
(`color:red`) silent, value miss (`#b4d455`) class + 1 warn naming
prop/value/site, prop miss class + 1 warn — all controls green —
while `css({ _wat: { color: 'red' } })` serves `""` with `[]` warns.

Free research, not spent: unseen literals (hex, oklch, color-mix,
13.37px/7ch/3.5cqw, `ruby`, numerics, shorthands, `!`, responsive,
hover) emit in ALL four positions (css, JSX, recipe base/variants/
compounds, globalCss fragments) with zero diagnostics; value,
important, responsive, conditional-value, numeric, and custom-prop
runtime misses all warn rightly; static unknown conditions get a
default `ATM-W-UNKNOWN-CONDITION` (compile half honest); empty-pool
sinks report `0 harvested values minted` honestly. Doom-log search
before hunting showed no entry on runtime condition-miss silence
(nearest: wave1 unknown-prop/breakpoint compile-channel siblings —
different mechanism and channel).

## Verdict

`break-found`. Repro:
`/tmp/doom-continuity-x-condition-miss.mts` (blind-runnable:
`cd /Users/ryn/Developer/reference-ui &&
./packages/reference-neo/node_modules/.bin/tsx
/tmp/doom-continuity-x-condition-miss.mts`; prereq `pnpm agentrs b`
only if the binding is stale). Violated contract: the miss path —
miss class + one dev warn naming prop/value/site
(`css.ts` header; NEO-CSS-16 pins it for runtime-only misses, and a
refused query is KNOWN-absent since compile never mints
unknown-condition classes, so a direct warn cannot cry wolf) —
plus the namer's own construct-don't-refuse philosophy and the
engine's default-visible severity for the identical static query.
In-bounds: complete static literal on pinned `css()` surface;
silence where a diagnostic is owed. Severity: user-facing —
dynamic/unscanned conditions paint nothing with zero signal in any
channel (compile default-silent on computed keys per
`ATM-W-UNFOLDABLE-KEY` channel-only, runtime silent), and no DOM
class to grep, unlike value/prop misses.
