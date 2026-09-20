---
date: 2026-09-20
cycle: 4
module: styletrace/wrappers
theories_spent: 1
verdict: break-found
---

# Styletrace misses body-destructured wrapper forwarding

## Hypothesis

Gap pursued: styletrace's JSX edge walker only knows param-derived prop
bindings (`parse_prop_bindings` reads the first parameter pattern only —
`modules/styletrace/src/analysis/parser/types.rs`), so a wrapper that
destructures style props from `props` in its BODY and forwards them into a
Reference primitive should be invisible to the wrapper graph, while its
param-destructured twin traces.

Red test written (`node /tmp/doom-styletrace-body-destructure.mjs
[repo-root]`, exit 1 = red): three components sharing the identical
boundary (`CardProps extends StyleProps`) and the identical flow into
`<Div>` — `ParamCard` (`({ color })` + `color={color}`, control),
`BodyCard` (`const { color } = props` + `color={color}`), `BodyRestCard`
(`const { title, ...rest } = props` + `{...rest}`). Research notes: the
doom log holds zero styletrace entries (thin log is itself signal); wave-1
ground (responsive-leaf-`!`, unknown-prop silence, tasty scan boundary) is
disjoint; the sibling pipeline detector DOES propagate body-destructured
signals (`record_pipeline_binding`, `parser/pipeline/util.rs`), so the JSX
edge path is inconsistent with the codebase's own convention, not just the
README. Theories 2–3 unspent — hunt stopped at one candidate per skill.

## Verdict

`break-found`. Repro `/tmp/doom-styletrace-body-destructure.mjs` (exit 1,
blind-verified): traced `["ParamCard"]` — `BodyCard` and `BodyRestCard`
missing. Violated contract: `modules/styletrace/README.md` ("whether style
props exposed at that component boundary actually flow into the Reference
primitive/style pipeline" via "direct prop forwarding such as
`color={color}`" and "rest/spread forwarding such as `{...rest}`") —
both probes expose `StyleProps` at the boundary and flow them into `Div`.
Severity: user-facing — atomic gates JSX extraction on the traced host
set (`ATM-SITE-08`), so use sites like `<BodyCard color="red" />` extract
nothing: silent missing paint. In-bounds: complete static TSX compile
input on the pinned surface; no will-never-work shape (the README
explicitly claims `{...rest}` forwarding as traced).
