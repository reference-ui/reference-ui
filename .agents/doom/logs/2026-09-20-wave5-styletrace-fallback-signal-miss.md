---
date: 2026-09-20
cycle: wave5
module: styletrace/wrappers
theories_spent: 1
verdict: break-found
---

# Styletrace misses fallback expressions in JSX signal position

## Hypothesis

Gap pursued: the JSX-edge signal predicate
(`expression_reads_style_prop` in
`modules/styletrace/src/analysis/model.rs:118-155`) returns false for
`LogicalExpression` and `ConditionalExpression` (both fall into the `_ =>
false` arm), so a wrapper that forwards a boundary style prop with a
static fallback (`color={color ?? "red"}`, `color={title ? color :
"red"}`) should be invisible to the JSX edge walker while the bare twin
(`color={color}`) traces.

Red test written (`node /tmp/doom-wave5-styletrace-fallback.mjs
[repo-root]`, exit 1 = red): three components sharing the identical
boundary (`CardProps = StyleProps & { title?: string }`) and the
identical sink (`<Div color={...} />`) — `DirectCard` (`color={color}`,
control), `NullishCard` (`color={color ?? "red"}`), `TernaryCard`
(`color={title ? color : "red"}`). Research notes: doom-log consult
(`styletrace`, `conditional ternary fallback logical nullish`) shows
zero coverage of fallback signal flow — the two styletrace entries are
wave-4's body-destructure and pipeline-object-arg hunts (both
fortified; canary `BodyCard` traces on the built binding, so the
repro runs against current code); no test or doc names this gap. The
walkers themselves descend INTO conditional/logical to find nested
JSX/pipeline calls (`walk/expr.rs:68-83`,
`parser/pipeline/expr.rs:61-70`) yet the signal predicates refuse to
see a signal sitting directly in one — inconsistent with the
codebase's own convention, not just the README. Theories 2–3 unspent
— hunt stopped at one candidate per skill. Unspent, seen in research
(for scheduling, not spent): the sibling pipeline predicate
(`expression_reads_style_signal`, `parser/pipeline/util.rs:81-125`)
shares the same `_ => false` arm over logical/conditional, so
`css({ color: color ?? "red" })` likely misses on the pipeline side
too (unprobed); `walk_pipeline_statement` (`parser/pipeline/mod.rs`)
still has no `FunctionDeclaration` arm while the JSX statement
walker does (`walk/mod.rs:35`), so pipeline use inside a nested
`function` declaration likely misses while the arrow twin traces
(unprobed).

## Verdict

`break-found`. Repro `/tmp/doom-wave5-styletrace-fallback.mjs` (exit 1,
firsthand): traced `["DirectCard"]` — `NullishCard` and `TernaryCard`
missing. Violated contract: `modules/styletrace/README.md` — "direct
prop forwarding such as `color={color}`" (:69) and the key rule
(:84-86), "whether style props exposed at that component boundary
actually flow into the Reference primitive/style pipeline" — all
three probes expose `StyleProps` at the boundary and flow them into
`Div`; a static fallback does not sever that flow. Severity:
user-facing — atomic gates JSX extraction on the traced host set
(ATM-SITE-08), so use sites like `<NullishCard color="red" />`
extract nothing: silent missing paint on a mainstream authoring shape
(default fallbacks). In-bounds: complete static TSX compile input on
the pinned surface, named imports; no will-never-work shape (the
fallback branches are static literals, the signal is a whole boundary
prop, not an interpolated/computed string).
