---
date: 2026-09-24
cycle: 1
module: atomic/diagnostics+extract/jsx
theories_spent: 1
verdict: break-found
---

# Bare JSX style attrs drop their diagnostic span

## Hypothesis

Gap pursued: refusals of bare JSX style attributes (`<Div color />`,
`<Div r />`) warn on the default channel with no file, line, or
column, while the identical refusal on every sibling surface is
located.

Mechanism: the bare-attribute emit site
(`extract/jsx/mod.rs:80-94`) pushes its `Want` via bare
`Want::new(...)` and records no position — no `with_oxc_span`, no
file/line/column — while the string path (`push_string_want`) and
the expression-container path both locate their wants. The want's
empty `DiagnosticLocation` (`atom/want.rs:46-53`) flows into the
resolve session, so the `InvalidCssValue` rejection is pushed
unlocated, and proof's `render_rejects` rewrite
(`proof/render.rs:159-172`) keeps the legacy (empty) location while
replacing only the message. The span is available at the emit site
(`attr.name.span()`) and analysis already sites bare attrs
(`analysis/jsx_attrs.rs:43-53`); extract just never records it.

Red test (`/tmp/doom-r1-atomic-bare-attr.mts`, blind-runnable via
repo tsx, exits 1): control `css({ display: true })` warns located
(`probe.ts:2:33`, passes); `<Div color />` and `<Div r />` warn
`ATM-W-MISSING-STYLE-PLAN`-free `ATM-W-INVALID-CSS-VALUE` at
`-:-:-` (both fail — file, line, and column all absent).

Not pursued (pinned or principled, verified by probe): the
`ATM-E-UNKNOWN-TOKEN` + unlocated `MissingStylePlan` pair
(`ATM-TOKEN-17` pins the pair); scalar-condition and unknown-`r`
default silence (`ATM-DIAG-05` pins ten refusals channel-only with
rationale); silent numeric folds (`0x10` → plan `top:16`, paints);
JSX unknown attributes (not style positions — may be component
props). Severity, registry, memo-soundness, span-math, and
responsive-shape audits all came back clean.

## Verdict

`break-found`. Repro: `/tmp/doom-r1-atomic-bare-attr.mts`
(run: `packages/reference-neo/node_modules/.bin/tsx
/tmp/doom-r1-atomic-bare-attr.mts` from the repo root; exits 1
with the two unlocated warnings shown; touches nothing in tree).

Violated contract:

- `ATM-DIAG-05` station header ("Every extract refusal carries
  file:line:col of the offending node") and the `Diagnostic`
  wire contract (`diagnostics/mod.rs` + `render.rs`: located
  `{file}:{line}:{col}` rendering) — the refusal carries none.
- Same-mistake inconsistency: `css({ display: true })`,
  `<Div color={true} />`, and `<Div css={{ display: true }} />`
  all warn located; only the bare-attr spelling drops the span.
- Proof's rewrite contract (keeps the resolver's code *and site*,
  `policy/proof.rs` test `proof_names_the_declaration_and_keeps_
  code_and_site`) — there is no site to keep.

Severity: user-facing (minor). A default-channel warning with no
position is unactionable in multi-file compiles — the author gets
prop + value but cannot jump to the sub-expression. Narrow shape
(bare attrs asserting `true` on props where `true` is invalid),
self-describing message, no silence and no wrong paint.
