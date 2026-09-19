---
date: 2026-09-19
cycle: 1
module: atomic/extract/harvest
theories_spent: 1
verdict: break-found
---

# Harvest mints percentages onto border-width props (invalid CSS)

## Hypothesis

Theory 1 (spent, RED): the harvest kind gate mints every Length pool
value onto every length-table prop, but percentages are invalid on the
border-width family (`<line-width>` takes no percentages). A pool
`"50%"` (valid ingredient, e.g. `width: '50%'`) crossed with a refused
`(borderTopWidth, [])` sink manufactures `border-top-width: 50%` —
invalid CSS from fully valid authorship. This is the same shape the
`NON_LENGTH_UNITS` exclusion already closes for angles/times/flex; the
percentage door was left open. Red test:
`/tmp/doom-wave1-T1-percentage-mint-red.ts` (exit 1; the project's own
`validateCss` oracle reports `{ kind: 'declaration', message:
'border-top-width: 50%' }`).

Free research killed without spending theories: sink-hook bypass (every
`Dynamic*` site funnels through `warn_dynamic`; no direct warns),
`important` loss in sinks (all walk contexts construct with
`important: false`; the flag comes only from value-string suffixes, so a
dynamic value can never be important), `["base"]`-vs-`[]` twin miss
(resolve drops `Skip` whens, `AtomSet` dedupes post-lowering, and the
twin spec counts want-level net-new), opaque-function over-mint (`var()`
/ `env()` only, valid everywhere), and Math-channel death (`Math`
shares the Length prop table).

Thin-log signal: the doom log was empty (`search "harvest"` and
`"literals pool sinks mint"` returned no matches), so no prior hunt
covers this module.

## Verdict

`break-found`. Repro: `/tmp/doom-wave1-T1-percentage-mint-red.ts`
(blind-runnable: `cd packages/reference-rs &&
./node_modules/.bin/tsx /tmp/doom-wave1-T1-percentage-mint-red.ts`;
probes at `/tmp/doom-wave1-probe1.ts`). Violated contract:
`packages/reference-rs/modules/atomic/src/extract/harvest/classify.rs`
("invalid CSS on length props, so harvest does not deal them"),
SPEC `ATM-VALID-02` ("A declaration value must always be valid CSS"),
tripped through the `cssIsValid` standing-gauge oracle
(`packages/reference-rs/testing/css.ts`). Lexer sweep shows the blast
radius is the full border-width family: `borderWidth`,
`borderTopWidth`, `borderRightWidth`, `borderBottomWidth`,
`borderLeftWidth`, `borderBlockWidth`, `borderInlineWidth` (all
mismatch `50%`; every other length-table prop accepts it). Severity:
user-facing — dynamic border widths resolving to a percentage get a
class every browser drops, plus sheet bloat and a standing-gauge
failure on any station compiling this shape. No warnings are emitted
(the mint path stays silent), so this is invalid output, not
misdiagnosis. Code left unchanged; only this log was added.
