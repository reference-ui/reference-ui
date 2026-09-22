# swarm-prelower REPORT: lowercase stored categories once at load, hot filters go alloc-free

One line: MCP icons index lowercases stored categories once at load so searchDemand/search filters use plain === with zero per-candidate allocs; lowers 4978/549 -> 1/4, browse 0.41 ms -> 0.36 ms.

Effect: demand-path lowers 4978 -> 4 (-99.9%), browse 0.41 ms -> 0.36 ms (-12.2%), before x3 + after x2 (NOT 8-pair — protocol deviation, disclosed below).

## Mechanism (one)

Stored categories were lowercased per candidate inside hot filters. The diet
lowers once at load (variant A, in-place, +12/-4, `prelower.patch` — the
filed arm); hot filters compare with plain `===` and allocate nothing. One
file: `packages/reference-mcp/src/pipeline/icons-search-index.ts`.

Variant B (unadjudicated, `prelower-B.patch`, +4/-2, `.map` lower)
implements the same lever independently; unattributed numbers. Adjudicate
hunk-by-hunk with a count probe before any landing.

## Scope

Off-scope surface: MCP icons ctor + `searchDemand`/`search` filter path
(TS). 0 sync ms by construction (reference-mcp TS only; reference-rs
cannot reference it); whole-sync delta not measured — integrator must
sum-confirm 0 on sync before any landing. Filed for index growth onto
MCP ground, not as a voyage yield.

## Proof (as filed — claims-quoted, crew parked mid-flight)

- Baselines: "already captured lock-free x3 (lowers 4978/549 exact, browse
  ~0.41ms, identity 17c0bece4865ea98)" (claims line 459).
- After: "after x2 browse ~0.357ms lowers 1, demand ~1.53ms lowers 4,
  identity match, 12/12 tests green" + "lock RELEASED (two-step)"
  (claims line 461).
- Rig (archived): `evidence/prelower/prelower-bench.mjs` (toLowerCase-counter
  census + interleaved browse/demand medians + 16-hex identity hash).
- DEVIATION: before-x3 + after-x2 satisfies counts + differential + identity
  + suites but NOT the 8-pair bar. An integrator must run the full 8-pair
  before any landing decision.

## Provenance

No crew REPORT.md survives; numbers are claims quotes + the bench rig,
nothing re-run. Captain spot-verified firsthand: WT5 +12/-4 and WT15 +4/-2
in place; `/tmp/prelower-diet.ts` byte-identical to the WT5 file per clerk
(recorded, not archived — duplicate of the patch). Base: diets vs
`1e1ad31d9`; rebase needed against the tip's rawindex LAND (same file).

## Verdict

**BANK** (off-scope MCP filter surface, captain sign-off as filing —
landing needs full 8-pair + integrator re-proof + captain firsthand).
