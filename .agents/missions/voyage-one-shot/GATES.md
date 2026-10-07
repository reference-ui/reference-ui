# GATES.md — frozen proof protocol and numeric bars (voyage-one-shot)

Authored in response to `reports/WAVE0.oracle.md` (W0-1, W0-2, W0-3, W0-5).
These gates are **frozen before R1 proves**. A wave's proof is admissible only
if every step below is executed and evidenced; a skipped step voids the wave.

## Frozen numeric gates (R1 and every config-load diet)

| gate | threshold | source |
| --- | --- | --- |
| config-import module loads | **totalLoads ≤ 5** (expected 2: temp bundle + `baseSystem.mjs`) | W0-1 |
| docs config phase | **p50 ≤ 50 ms** | W0-1 |
| whole-sync delta | **≥ 15 ms and ≥ 1.5% of `syncTotal`** vs Wave 0 (1548 ms / 1673 ms) | agent-perf LAND bar |
| `evaluateMs` | **≤ 50 ms** | W0-1 |
| `bundleMs` regression | **≤ 2× Wave 0** (Wave 0 = 13–14 ms → ceiling 28 ms) | W0-1 |
| byte-identity | `verify-pins.mjs` **PASS** (docs + lib + icons) **and** the mcp/T16 decision below | W0-5 |
| suites | config-touching suites green on the exact tree (enumerated per wave) | §5 |

Counts are **necessary but not sufficient**: read jointly with timing (W0-4).
A counts win that moves cost into `bundleMs`, or a CJS-heavy regression that
undercounts ESM loads, fails on the timing prong.

## Ordered proof protocol (mandatory sequence)

1. **Attest dist provenance (W0-3).** `dist/` is gitignored and has no freshness
   guard. Before timing: rebuild `packages/reference-neo` from the pinned tip
   (`node packages/reference-neo/tools/build-bin.mjs`), record clean-tree
   status + build wall time, and hash the dist inputs. Record that lib/icons
   `dist` are unchanged since Wave 0 (or rebuild + re-pin). A wave whose dist
   revision is unattested is void.
2. **Census.** `census/run.mjs` → `totalLoads` + per-package table.
3. **Timing.** `run-samples.mjs sync packages/reference-docs 16` → per-phase
   p50 (warmups unscored); config, evaluate, bundle medians against the table.
4. **Identity — sync first, then verify.** Run the three fresh self-syncs
   (`measure-one-shot.mjs sync` for docs, lib, icons), attach the outputs, and
   only then `verify-pins.mjs`. A verify without a preceding fresh sync is
   **vacuous** (W0-2) and does not count.
5. **Suites.** Run the config-touching suites named for the wave; paste exact
   commands + results.

## mcp / T16 coverage decision (W0-5)

R1 migrates `matrix/tests/mcp` and `matrix/tests/chain/T16`, whose outputs are
unpinned. Decision: **pin them if deterministic**; otherwise name the exact
suites whose green status is the identity bar. Resolve this in Wave 1's proof
step 5; do not leave "probably caught by suites."

## Authored artifacts

- Numeric gates + protocol: this file.
- Harness hardening (verify-pins staleness guard, dist-provenance helper,
  mcp/T16 pins): Wave 1.5 crew, after R1 returns.
