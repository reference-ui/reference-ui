---
date: 2026-09-20
cycle: jettison-acceptance-trebledoom
module: atomic/namer(tokens)
theories_spent: 3
verdict: break-found
---

# Jettison namer: braceless token refusal mints on one side only

## Hypothesis

Brief seed: "find a request the runtime namer and the compiler namer
spell differently." Three gaps pursued to empirical depth (all three
prior namer-differential reports read to avoid repetition, not re-run;
the six closed shapes are TOKEN-12 braced surplus, container
padded-"true", range-width gating, twin conditions, border token-kind
guards, and range dispatch fallthrough):

- **T1 — token refusal with a braceless stem (FILED).** The carve-out
  assumes every token refusal wears braces, but `unbraced_fallback`
  (`tokens/mod.rs`) drops any value that merely STARTS with `{` and
  ENDS with `}` with non-empty interior — including `"{}}"`, whose
  stem fails the carve regex `/\{[^}]+\}/` (its only `{` is
  immediately followed by `}`). The namer never runs refusal, so it
  keeps the stem. Red test: `/tmp/doom4-t1.mjs` — BREAKS (oracle 2,
  namer 3, surplus `bd-c_{}}` non-braced, sheet-absent).
- **T2 — shortest-tie render digits (OBSERVED, unfiled — one break
  per brief).** Rust `render_decimal` is `f64::to_string` (never
  exponent); JS `renderDecimal` is `String` plus `expandExponent`.
  Both claim shortest round-trip, but ties break differently: 221 of
  136,534 fuzzed in-magnitude f64s render a different last digit
  (e.g. `752396555469991.2` → Rust `…991.3`, JS `…991.2`; same f64
  bits both sides, zero parse diffs). End-to-end: `width:
  '752396555469991.2'` spells `w_…991.3` vs `w_…991.2`. Red tests:
  `/tmp/doom4-t2.mjs` (fuzz, needs `/tmp/doom4-render`), `/tmp/doom4-t2e2e.mjs`
  (pipeline). Captain may rebrief; not the filed break.
- **T3 — font-scale extras with a non-canon key (OBSERVED, unfiled —
  one break per brief).** `FontDefinition.css` is an open key map, but
  the prefix fallback differs: Rust `class_prefix_for_prop` uses the
  canonical VERBATIM on a `find_property` miss, JS `classPrefix`
  falls to kebab. Extras key `MyProp` spells `MyProp_2px` vs
  `my-prop_2px` (slot agrees). Red test: `/tmp/doom4-t3.mjs` —
  BREAKS. Captain may rebrief; not the filed break.

Research ruled out without spending theories (free per protocol):
alias dispatch orig-vs-canon (all 315 `ALIASES` entries read — none
target font/weight/container/size/textGradient/variant/colorMode/
border/flex); unknown-prop plans (all three capture paths gated by
`is_known_style_prop`: site walk, staticCss, harvest sinks);
extraction float normalization (`ast_to_json_value` casts
near-integral floats to i64, so flex/zero exact-match gates agree —
plus zero parse diffs across the 147k-spelling T2 fuzz); scoped
weight first-dot both sides (`split_once` ≡ `indexOf`); L1–L6
lexical ports line-identical; 12/12 agreement controls
(`p`/`font: sans`/`flex`/`border: 0`/`outline: none`/`container`/
`size`/`width: 1e3`/`color`/`margin: inherit`/pair/`weight` —
`/tmp/doom4-controls.mjs`).

## Verdict

`break-found` (T1). System: stock lib spec, unmodified. Request
`{ prop: 'border', value: '2px solid {}}', when: [], important: false }`:

- oracle: `["borderWidth …__bd-w_2px", "borderStyle
  …__border-style_solid"]` (color longhand refused)
- namer: `[…same two…, "borderColor …__bd-c_{}}"]`

Violated contract: NEO-NAMER-01 / R3 — byte-equal slot and className
lists; the differential gate fails at the carve-out's form gate (the
surplus clears direction and sheet but is not a braced token
refusal). Outside all six closures: non-braced (cf. TOKEN-12), no
padding/widths/conditions/guards/ranges involved.

Severity: user-facing, low (exotic brace-`}` values only; standard
token refusals still carve). Repro:
`/tmp/jettison-namer4-repro.mjs` (self-contained; exit 1 = break).
No fix, no fortify — captain rules next.
