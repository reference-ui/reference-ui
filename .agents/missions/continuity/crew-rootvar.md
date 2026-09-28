# OPERATION CONTINUITY-01 — Crew ROOT-VAR report

HQ ruling implemented: the compiler auto-defines `--spacing-root: 0.25rem`
(the lib value, `global.ts:4`); an author definition always wins. No commits
made (captain commits).

## 0. Design (why not the naive unshift)

The report's option A (unshift a `:root` fragment first in the spec) is
correct for single sheets but breaks on extends chains: the merge nests each
system's `@layer global` inside its own package layer with the consumer last,
so a downstream baked default would outrank an upstream author's
`--spacing-root` (layers dominate specificity and order). Pinning
"author always wins" therefore needs the default BELOW every package layer.

Implementation: the engine emits the default as its own top-level
`@layer root` stream, printed before the package wrap (single sheets) and
hoisted ahead of the `@layer …;` statement by `mergeStreams` (extends).
First-declared layer = lowest rank, so every author definition — any
package, any inner layer, unlayered consumer CSS — wins by cascade rank.
Upstream root copies drop at merge print (reset precedent); the six-layer
preamble string is untouched. Rejection/fail-closed artifacts stay bare
preamble (never served; `preamble_only` unchanged). Boundary, documented in
code: an author `@layer root` in an EARLIER stylesheet would join below the
default (pathological; same-name layers merge).

## 1. Diff summary

Rust (`modules/atomic/src/stylesheet/`): NEW `root_default.rs` (ruled
value const, verbatim block, append fn, unit tests); `emitter/streams.rs`
(new `root` field, 9→10 wire keys, both joins prepend it outside the wrap);
`emitter/mod.rs` (sequential oracle builds prepend it too);
`stylesheet/mod.rs`, `types.rs` (10-key doc), `layers/mod.rs` + `layers/README.md`
+ `SPEC.md` (prose that the new shape falsified, only those lines).
`contracts/types.ts` + `js/types.ts` + `compile-result.json` fixture gain
the field (fixture sheets keep their pre-existing preamble drift, noted).

Neo (`src/system/base/`): `types.ts` + `sources.ts` gain `root?`;
`streams.ts` hoists own-root pre-statement, drops upstream roots,
publishes the entry with root; `streams-corpus.ts` entries are
engine-shaped (splitter peels the leading root chunk; LEGACY stays
rootless as the backward-compat pin); `streams.test.ts` /
`streams-goldens.test.ts` updated + 3 new root pins (hoist, exactly-one,
rootless-merge). `sources.test.ts` pins +3 lines. Vendored typegen
regenerated via the blessed tool (+1 line mine; `diagnostics/js/index.d.ts`
hunk is T-fortify-carried, itemized §4).

New tests: `ATM-ROOT-01` (default-only system, zero-rhythm input: default
first, sole definition, no calc), `ATM-ROOT-02` (author `0.5rem` in
`@layer global` after the default + `140r`/`2r` calcs, zero diagnostics),
`NEO-CHAIN-07` (real synced upstream at `0.5rem`; three paint phases:
standalone `560px`, extended `1120px`, consumer `1rem` override `2240px`).

## 2. Pins (winner, explicitly)

- Single sheet: `@layer root` block at offset 0; author `:root` later in a
  higher layer wins (ROOT-02 text, cascade-order `rootRank == 0`).
- Extends: hoisted own-root, then statement, then upstream blocks rootless,
  then own inner (merge unit pins + TRANSITIVE/NORMAL/NORESET goldens).
- Effective root: CHAIN-07 computed `--spacing-root` + `140r` paint per
  phase (0.25 → 0.5 → 1rem). Author value AND placement pinned (their
  rule stays in their `@layer global`, never merged into root).

## 3. Suites + results

| Suite | Result |
|---|---|
| `agentrs c` (workspace cargo, 39 targets) | ALL GREEN (atomic 735) |
| `agentrs v` (all modules, 647) | 646 green; 1 known red (below) |
| `agentrs q` (touched files) | 0 violations (warns only in untouched files) |
| neo unit vitest (551) | 549 green; 2 pre-existing HINTS reds (below) |
| `agentneo run` (283 cases) | 282 green; SITE-16 foreign (below) |
| `agentneo q` (touched + new case files) | 0 errors (1 file-lines warn on corpus, §5) |

Pre-existing/foreign reds, itemized, untouched:
1. `harvest-census` react.mjs pin (158317 vs 158073) — the brief's known
   red; value unchanged by this crew.
2. neo `sync-diagnostics` + `ref.test.ts --verbose` — engine help-line copy
   (HINTS commit `36dc3ca9d`, Sep 26) vs stale test expectations; committed
   mismatch predating the mission. Proven by source blame.
3. `NEO-SITE-16` — member utilities absent from fresh sync output.
   Stash-proven red at HEAD without my engine change (my TS is a no-op
   under the HEAD engine); needs owner triage, suspect R/T window unproven.
4. Lock-test flakes (`clean-repro`, `session-repro`): failed once each
   under full-suite contention, pass solo/isolated; no lock code touched.

## 4. Goldens attested per pair (never blanket)

- 247/247 ATM `styles.css`: script-verified `new == ROOT(52B) + old`
  byte-exact (`/tmp/attest-goldens.mjs`); zero `css.json`/`diagnostics.json`
  churn (default mints no atoms/plans). 6 spec `startsWith` updates reviewed.
- `harvest-census` css cells: +52 raw / +1 rule / plans unchanged, re-pinned
  with ruling comment; gzip/brotli follow the same insertion.
- 4× `scan-goldens.*.json`: +52B each, runtimeSha unchanged each, sheets
  root-first verified at capture; 3 pins per file, 12+/12- total.
- `streams-corpus` goldens (NORMAL/NORESET/TRANSITIVE + 11 reprints):
  hand-composed ROOT-hoist expectations, suite green.
- `NAMER-04` embedded sheet literal: refreshed from fresh sync output,
  verified `fresh == ROOT + old literal` byte-exact.
- No T-output fallout in regen goldens (corpus holds no r-valued tokens;
  consistent with DOOM-T "latent trigger").

## 5. Surprises

1. T-fortify landed mid-task in my files (`append_tokens` sink args):
   noticed via a failed exact-match edit, integrated on the live tree —
   no divergence (my streams.rs = HEAD + my edits, verified).
2. No ATM-ROOT id collision: doom-R took `ATM-RHYTHM-07`, not ROOT.
3. `streams-corpus.ts` tripped the 365 file-lines warn (362→389);
   warn-only, non-failing; splitting a hand-written golden corpus would
   churn goldens, so left with this note. Complexity warn fixed by split.
4. `helpers.ts` 386-line warn pre-exists (385 at HEAD; my edit net-zero).
5. Background tasty `TST-E-SCAN-FAILED` temp-dir noise appears in case
   runs; cases pass; unrelated to this change.
