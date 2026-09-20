---
date: 2026-09-20
cycle: jettison-acceptance-quaddoom
module: atomic/namer(shape)
theories_spent: 3
verdict: break-found
---

# Jettison namer: integer-like per-prop keys enumerate in different orders

## Hypothesis

Brief seed: "find a request the runtime namer and the compiler namer
spell differently." Three gaps pursued to empirical depth (all four
prior namer-differential reports read to avoid repetition, not re-run;
the nine closed shapes are TOKEN-12 braced surplus, container
padded-"true", range-width gating, twin conditions, token-kind guards,
range dispatch fallthrough, braceless-refusal carve, shortest-tie
rendering, and prefix-fallback kebab):

- **T1 — integer-like per-prop key order (FILED).** The oracle
  iterates per-prop objects in insertion order (`serde_json`
  `preserve_order`, pinned by the reverse-alpha test), but the namer
  iterates `Object.entries` over the napi-built JS object — and V8
  `[[OwnPropertyKeys]]` always enumerates canonical numeric indices
  first in ascending order, regardless of insertion. Any per-prop
  object with 2+ integer-like keys in non-ascending author order
  spells the same declarations in different orders. Red test:
  `/tmp/doom5-t1.mjs` — BREAKS (oracle `[10, 2]`, namer `[2, 10]`,
  `plan.value` already reordered to `["2","10"]` in JS). This
  disproves the doom-2 research claim "object key order equal via the
  Rust-serialized plan" at exactly the integer-like keys.
- **T2 — `__proto__` per-prop key (KILLED).** Suspected napi
  property-sets would route `__proto__` through the prototype setter
  and drop the member namer-side. Wrong: napi materializes it as an
  own property (`ownKeys` shows it), and both sides spell
  `_proto__:color` plus the `md` control identically.
  `constructor` control also agrees. Red test: `/tmp/doom5-t2.mjs`.
- **T3 — L3 grammar boundary in width gating (KILLED).** Fuzzed 34
  widths across the exact `str::parse::<f64>` acceptance boundary the
  briefs never touched (`inf`/`nan`/`Infinity` spellings and
  near-misses, dot/exponent edges, radix, underscores, padding,
  unicode digits; doom-2's exact widths excluded) × all three range
  arms (`Down`/`smTo*`/`Only`, 102 plans). 102/102 agree — the L3
  port is airtight. Red test: `/tmp/doom5-t3.mjs`.

Research ruled out without spending theories (free per protocol):
lower_when arm order identical (catalog→breakpoint→range→at-rule);
twin-of-twin dead (`ConditionMap::get` is a pure probe over
authored+one-twin, tables mirror it exactly — v4 closure complete);
names-without-widths unreachable (spec path always pairs widths);
nested array/object members skipped both sides; `$r` shapes
identical incl. non-number stringify; 315/315 aliases audited (no
macro targets, no macro keys, no chains; `m`/`p` canon both sides);
slot/join/segment byte-identical with no sanitize either side; trio
predicates line-identical (units set, math fns, numeric, rhythm);
flex trims both sides; lowering scalar flags mirror the
`extract_raw_val` gate; collapse/fence/sanitize identical. 5/5
controls hold (`/tmp/doom5-controls.mjs`: ascending numerics,
non-numerics, single, standard agree; mixed splits by the same
mechanism).

## Verdict

`break-found` (T1). System: stock lib spec + authored conditions
`10`/`2`. Request `{ prop: 'color', value: { "10": 'red', "2":
'blue' }, when: [], important: false }`:

- oracle: `["10:color @reference-ui/lib__10:c_red", "2:color
  @reference-ui/lib__2:c_blue"]` (source order)
- namer: `["2:color @reference-ui/lib__2:c_blue", "10:color
  @reference-ui/lib__10:c_red"]` (V8 index order)

Violated contract: NEO-NAMER-01 / R3 — byte-equal slot and className
lists in order; the differential gate fails at the order check
(`order drift at declaration 0`). Outside all nine closures: no
braces, tokens, padding, widths, twins, guards, ranges, numerals, or
prefix misses — pure enumeration-order drift, which no carve arm
forgives (identical sets, different sequence).

Severity: user-facing, low (per-prop objects with 2+ canonical
numeric keys in non-ascending order only; gate-red shape; the namer
cannot recover author order from a JS object on this substrate).
Repro: `/tmp/jettison-namer5-repro.mjs` (self-contained; exit 1 =
break). No fix, no fortify — captain rules next.
