---
date: 2026-09-20
cycle: jettison-acceptance-rebrief
module: atomic/namer(conditions)
theories_spent: 1
verdict: break-found
---

# Jettison namer: unparseable-width ranges mint on one side only

## Hypothesis

Brief seed: "find a request the runtime namer and the compiler namer
spell differently." One gap pursued (log thin on this module — the
only prior namer-differential hunt is the fixed container-pad find;
its T1/T2/T3 were read to avoid repetition, not re-run):

- **T-A — width-gated ranges vs the width-blind namer.** Rust
  `breakpoint_down/only/between` (`resolve/conditions/mod.rs`)
  require `width_px(name).parse::<f64>()` and return `None`
  (→ `Unknown`, member dropped) when the authored width is not a
  bare float spelling. JS `isDown/Only/BetweenRange`
  (`js/namer/when.ts`) test `tables.breakpoints` membership only —
  and `NamerTables` ships names with no widths (`runtime/tables.rs`),
  so the gate is unmirrorable by construction. No width validation
  exists at lowering (`into_px` stores verbatim). Red test:
  `/tmp/jettison2-ta.mjs` — 6/6 split probes break, 4/4 controls
  agree (including the subtle `emptyOnly`-on-last-bp agree: the
  last-breakpoint `Only` path never parses). FAILS (break).

Research ruled out without spending theories (free per protocol):
lexical L1–L6 identical (grammar, trim set, sanitize, collapse,
ascii-fold); catalog equivalent (dual-key ≡ strip-then-test incl.
multi-underscore and empty keys); trio/TRBL/pair/flex guards and
classify identical; tokens/rhythm stem-neutral except the braced
carve-out; kebab/prefix agree (all alias canonicals listed);
unrealizable ∩ lowerings is only `textGradient`, claimed both
sides; no aliases on macro/border-bool/owned props (dispatch
equivalent); object key order equal via the Rust-serialized plan.

## Verdict

`break-found`. System: lib spec + authored `tablet: '48rem'`
(schema-valid, lowering-accepted, zero diagnostics). Request
`{ prop: 'color', value: { tabletDown: 'red', md: 'blue' },
when: [], important: false }`:

- oracle: `["color@md @reference-ui/lib__md:c_blue"]`
  (tabletDown member dropped: `UnknownCondition`)
- namer: `["tabletDown:color
  @reference-ui/lib__tabletDown:c_red", "color@md
  @reference-ui/lib__md:c_blue"]`

Violated contract: NEO-NAMER-01 / R3 — byte-equal slot and className
lists; the differential gate (`expectEqual`,
`differential.spec.ts`) fails at the carve-out's form gate
(`extra class is not a braced token refusal`). Outside the
carve-out: the surplus is non-braced (`braced=false` in the repro),
while the carve forgives only braced-stem + absent-from-sheet
namer surplus. Same split for `smTotablet`, `tabletOnly`
(non-last), `paddedDown` (`'640 '`), `hexDown` (`'0x280'`),
`emptyDown` (`''`); standard-scale ranges agree, so the port is
otherwise faithful here.

Severity: user-facing, low (custom non-px-parseable breakpoint
widths only; standard scales unaffected; runtime emits a class the
sheet never carries). Repro: `/tmp/jettison-namer2-repro.mjs`
(self-contained; exit 1 = break). No fix, no fortify — captain
rules next (HQ: no auto-fortify loop; ruling goes to HQ).
