---
date: 2026-09-20
cycle: wave4
module: styletrace/pipeline
theories_spent: 1
verdict: break-found
---

# Styletrace pipeline detector misses object-literal signal args

## Hypothesis

Gap pursued: the pipeline sink check (`walk_call` arg test in
`analysis/parser/pipeline/expr.rs:42-48` via
`expression_reads_style_signal` in `parser/pipeline/util.rs:81-119`)
only recognizes bare identifiers, member reads, and transparent
wrappers as style-signal flow — object/array literals fall into the
`_ => false` arm. So `css({ color })` and
`css({ color: props.color })` should be invisible to the pipeline
detector while the same signal passed bare (`css(color)`) traces,
though all three flow a boundary style prop into the same `css()`
pipeline call.

Red test written (`cargo test --offline` in
`/tmp/doom-wave4-styletrace-pipeline`, 1 red): three components
sharing the identical boundary (`CardProps = StyleProps &
{ title?: string }`) and the identical sink (`<div
className={css(...)} />`, lowercase host so no JSX edge can rescue
the verdict) — `IdentCard` (`css(color)`, control), `ObjCard`
(`css({ color })`), `MemberObjCard`
(`css({ color: props.color })`). Research notes: doom-log consult
(`styletrace`, `pipeline css object args`) shows zero pipeline
coverage — the one styletrace entry is wave 2's wrapper/JSX-edge
hunt (body-destructure, a different surface); brief-covered ground
is disjoint. The detector even walks INTO object literals for
nested calls (`walk_object`) yet refuses to see a signal sitting
directly in one — and the traced shape (`css(color)`, a bare
string into a style-object call) is the odd one while the missed
shape is the dominant authoring form. Theories 2–3 unspent — hunt
stopped at one candidate per skill. Unspent, seen in research (for
scheduling, not spent): zero-arg `splitCssProps()` in an array
pattern panics the tracer (`util.rs:76` `.expect`), killing the
whole trace instead of isolating the file; pipeline use inside a
nested `function` declaration is missed while the arrow twin
traces (the JSX edge walker visits both).

## Verdict

`break-found`. Repro `/tmp/doom-wave4-styletrace-pipeline` (run
`cargo test --offline` there; path-dep on the tree, fixture
sync-root, same-machine blind): traced `["IdentCard"]` —
`ObjCard` and `MemberObjCard` missing. Violated contract:
`modules/styletrace/README.md` — "direct style-pipeline usage
such as `splitCssProps`, `box`, and `css`" (:76) and the key rule
(:84-86), "whether style props exposed at that component boundary
actually flow into the Reference primitive/style pipeline" — all
three probes expose `StyleProps` at the boundary and flow them
into `css()`. Severity: user-facing — atomic gates JSX
extraction on the traced host set (ATM-SITE-08), so use sites
like `<ObjCard color="red" />` extract nothing: silent missing
paint on a mainstream authoring shape. In-bounds: complete
static TSX compile input on the pinned `css()` surface, named
imports; no will-never-work shape.
