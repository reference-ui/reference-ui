---
date: 2026-09-20
cycle: jettison-acceptance
module: atomic/namer(container)
theories_spent: 3
verdict: break-found
---

# Jettison namer: padded-"true" container drops the name

## Hypothesis

Brief seed: "find a request the runtime namer and the compiler namer
spell differently." Three gaps pursued to empirical depth (log thin on
this module — no prior namer-differential hunt; this is the first):

- **T1 — f64 rendering across the seam** (`renderValue` JS `String(n)`
  vs `AtomValue::Number` serde/ryu spelling). Observed REAL diff on
  `font: 1e21` (oracle `...807`, namer `...776000`) but root cause is
  muddy: extraction saturates to i64::MAX and napi loses precision, so
  the namers receive different values. Clean variants all agree
  (`-0.0` normalizes in extraction; 1e18/5e18/1e-5/1e-7 spell
  identically). Filed away, not filed.
- **T2 — bare vs underscored catalog keys** (JS strips-then-tests
  membership; suspected Rust requires `_`). Killed in research:
  `ConditionMap::get` is dual-key (`condition_map.rs`), so both sides
  accept both spellings. Empirically confirmed: `color: {dark: 'red'}`
  agrees (`dark:c_red`) on both sides.
- **T3 — container bare-`"true"` guard trims on one side only.**
  Rust `container::lower` (`resolve/container.rs`) compares the
  UNTRIMMED rendering against `BARE_VALUE`; the table's `{eq: 'true'}`
  step evaluates on the TRIMMED rendering (`guardPasses` in
  `js/namer/lower.ts` trims first). Any whitespace-padded `"true"`
  takes the bare path in JS but the named path in Rust. Red test:
  `/tmp/jettison-namer-repro.mjs` — FAILS (break).

## Verdict

`break-found`. Request `{ prop: 'container', value: 'true ',
when: [], important: false }` (trailing space; leading/tab/mixed
padding diverge identically — `' true'`, `'\ttrue'`, `' \t true \n '`
all probed):

- oracle: `[containerType …__cq-t_inline-size, containerName
  …__cq-n_true_]` (2 declarations)
- namer: `[containerType …__cq-t_inline-size]` (drops the name)

Violated contract: NEO-NAMER-01 / R3 — byte-equal slot and className
lists; oracle-minus-namer, which the differential gate (`expectEqual`,
`differential.spec.ts`) always fails. Outside the carve-out twice
over: the dropped class is non-braced and IS in the sheet
(`braced=false inSheet=true` in the repro), while the carve forgives
only braced-stem + absent-from-sheet namer surplus. Exact-`"true"`,
`font: 'sans'`, and the T1/T2 controls all agree, so the port is
otherwise faithful here.

Severity: user-facing, low (whitespace-typo input; one dropped class;
gate-red shape). Repro: `/tmp/jettison-namer-repro.mjs` (self-contained,
writes its own fixture; exit 1 = break). No fix, no fortify — captain
rules next.
