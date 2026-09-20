---
date: 2026-09-20
cycle: jettison-acceptance-doubledoom
module: atomic/namer(conditions)
theories_spent: 3
verdict: break-found
---

# Jettison namer: multi-underscore twin known on one side only

## Hypothesis

Brief seed: "find a request the runtime namer and the compiler namer
spell differently." Three gaps pursued to empirical depth (both prior
namer-differential reports read to avoid repetition, not re-run; the
closed shapes are TOKEN-12 braced surplus, container padded-"true",
and range-width gating):

- **T1 — catalog twin strips once per side, asymmetrically (FILED).**
  Rust `ConditionMap` registers each authored key plus ONE twin
  (`condition_map.rs::insert_twin`: strip one `_`, or add one), so
  authored `__x` answers `_x`. JS `namedCondition` (`when.ts`)
  strips one `_` from the REQUEST and tests membership in
  `tables.conditions`, which holds strip-one(KEYS) — `_x` becomes
  `x`, which no key strips to. Any authored key starting with `__`
  is oracle-known / namer-unknown at its twin. Red test:
  `/tmp/doom3-t1.mjs` — BREAKS (oracle 2, namer drops `x:color`).
  Note: the doom-2 report claimed "dual-key ≡ strip-then-test incl.
  multi-underscore" — that claim is wrong at exactly this twin; the
  agreeing multi-underscore probes were same-or-fewer-underscore
  requests, never the twin.
- **T2 — `$token` paths run emit guards on one side only
  (OBSERVED, unfiled — one break per brief).** Rust
  `expand_shorthand` gates the whole border/flex/dimensional arm
  behind `extract_raw_val` (string/number only), so token values
  pass through kind-preserved; JS runs the zero/ring emit-guard
  steps on the rendered path for ALL kinds. `token('none', '#000')`
  on `outline`: oracle 1 decl (`outline_none`), namer 2 (ring plus
  offset, token kind lost). Control `token('colors.red.500',
  '#000')` agrees. Red test: `/tmp/doom3-t2.mjs` — BREAKS.
  Captain may rebrief; not the filed break.
- **T3 — range arms: early-return vs OR-chain (OBSERVED, unfiled —
  one break per brief).** Rust `breakpoint_range`
  (`conditions/mod.rs`) returns `breakpoint_down`'s `None`
  immediately for any `*Down`/`*Only`-suffixed key and never tries
  the between arm; JS `isKnownRange` OR-chains all three arms. With
  authored breakpoints `a='100'`, `xDown='200'`, key `aToxDown`:
  oracle drops (unknown), namer mints `aToxDown:c_red`, non-braced
  surplus. Red test: `/tmp/doom3-t3.mjs` — BREAKS. Captain may
  rebrief; not the filed break.

Research ruled out without spending theories (free per protocol):
font/weight macros untrimmed on both sides (`class_name_str`);
scoped-weight first-dot both sides; tokenizer separator sets
identical; trio/TRBL/flex/pair/size/gradient/container gates and
order identical; `is_color_prop` canonicalizes (no alias fence);
`class_prefix_for_prop` canonicalizes; lexical L1–L6 identical;
token/rhythm drops are always braced (Missing and the braced-drop
both imply `\{[^}]+\}`); parent-reference machines identical;
`from_catalog` strips one `_` like the namer.

## Verdict

`break-found` (T1). System: lib spec + authored `__x: '[data-x] &'`
(schema-valid conditions entry). Request `{ prop: 'color', value:
{ _x: 'red', md: 'blue' }, when: [], important: false }`:

- oracle: `["x:color @reference-ui/lib__x:c_red", "color@md
  @reference-ui/lib__md:c_blue"]`
- namer: `["color@md @reference-ui/lib__md:c_blue"]` (drops
  `x:color`)

Violated contract: NEO-NAMER-01 / R3 — byte-equal slot and className
lists; the differential gate fails at the direction gate
(oracle-minus-namer always fails naming the missing declaration).
Outside the carve-out twice over: the carve forgives only
namer-side surplus, and this is a namer-side DROP of a non-braced
class the sheet carries (`braced=false inSheet=true` in the
repro) — the carve-out's exact inverse. Outside the other closures:
no padding (cf. container-pad), no widths parsed (plain catalog
condition plus standard `md`, cf. range-width).

Severity: user-facing, low (multi-underscore condition keys only;
single-underscore catalog, breakpoints, and ranges unaffected;
runtime omits a class the sheet ships). Repro:
`/tmp/jettison-namer3-repro.mjs` (self-contained; exit 1 = break).
No fix, no fortify — captain rules next.
