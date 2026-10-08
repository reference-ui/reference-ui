---
date: 2026-09-20
cycle: wave2
module: canon/generate/join
theories_spent: 1
verdict: break-found
---

# Canon join admits hallucinated names on borrowed css

## Hypothesis

The fail-closed join: `packages/reference-rs/modules/canon/README.md:46`
("a dialect CSS extension is missing from `EXTENSIONS`" → abort) and SPEC
`CAN-JOIN-02` ("any emitted property not defined in W3C standards is
explicitly registered in the `EXTENSIONS` table") pin the property NAME as
the joined identity. The `CAN-FAIL-05` station only poisons name+css
together, so the validator's boolean shape is unexplored ground.

Gap pursued: `validateDialectExtJoin`
(`packages/reference-rs/modules/canon/generate/join.ts:106-110`) passes a
property when EITHER its name OR its css is platform-or-extension. A
hallucinated name riding a borrowed legit css form (`{ name: 'foobarProp',
css: 'color' }`) therefore clears the gate with zero diagnostics, and the
orchestrator (`generate/generate.ts:83-88`) emits whatever the gate passes.
Red test: push that row into the real loaded dialect and assert the
validator aborts naming `foobarProp`.

Free-research kills (no theories spent): vendor-`color` presence-vs-truth
is moot (`color?: true` type makes `false` unconstructible); the shorthand
join is non-vacuous on real data (169/169 platform shorthands matched);
zero of 315 alias canonicals dangle; `webkitTextFillColor` emits the
platform `-webkit-text-fill-color` row with its leading dash. Measured:
all 1073 authoritative rows pass via BOTH name and css — no legit row
needs the css-side OR, so it is pure slack, not load-bearing.

Thin-log note for scheduling: `node .agents/doom/cli.mjs search "canon"`
returned zero matches before this hunt — canon had no logged coverage.

## Verdict

`break-found`. Repro `/tmp/doom-wave2-canon-join-or-bypass.mts`
(blind-runnable:
`packages/reference-rs/node_modules/.bin/tsx /tmp/doom-wave2-canon-join-or-bypass.mts [repo-root]`,
exit 1) shows baseline 0 errors on the authoritative dialect, then 0
errors with `foobarProp` (name: not webref, not in `EXTENSIONS`) injected
— the gate stays silent where its contract owes an abort.

Violated contract: the fail-closed join (README `join.ts` rule +
`CAN-JOIN-02`), code
`packages/reference-rs/modules/canon/generate/join.ts:106-110`
(`validateDialectExtJoin` OR-clause).

Severity: build-gate hole, latent user-facing. Today `loadDialect` cannot
mint such a row, so nothing ships yet — but the validator is the ONLY gate
between a bad overlay/webref drift and the shipped dictionary, and it
blesses hallucinations: an emitted `foobarProp` would make
`is_known_style_prop` bless author typos and `to_css_declaration_property`
mis-emit them as `color`. Same contract-vs-code shape as wave-1(c),
which ruled IN-BOUNDS.

Honesty note for review: the OR may predate the current ingest (every live
row now satisfies both sides). Fix direction (name-only check vs.
re-ratifying the OR with a witness row) needs an architect ruling — but
contract and code cannot both stay as they are.
