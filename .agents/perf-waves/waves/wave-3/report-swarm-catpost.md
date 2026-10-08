# swarm-catpost REPORT: prebuilt category postings skip MiniSearch wildcard on browse

One line: MCP search({category}) browse serves prebuilt category-to-entries postings instead of a MiniSearch wildcard; browse median 0.374 ms -> 0.002 ms (-99.5%), 8/8 agree.

Effect: browse 0.374 ms -> 0.002 ms (-99.5%), 8/8 agree, identity 42/42, suites 12/12 (all as filed in claims; captain did not witness timing).

## Mechanism (one)

`search({category})` browse ran a MiniSearch wildcard query per call. The diet
prebuilds `categoryPostings` (+ `allPostings`) at load; category browse reads
the postings directly and never touches the wildcard path. One file:
`packages/reference-mcp/src/pipeline/icons-search-index.ts` (+32/-15,
variant A — the filed-numbers arm, `catpost.patch`).

Variant B (unadjudicated race mate, `catpost-B.patch`, +51/-12,
`categoryIndex` + dedupe-keys) implements the same lever independently; its
numbers were never posted. Overlap must be adjudicated hunk-by-hunk with a
count probe before any landing; first sound LAND wins.

## Scope

Off-scope surface: MCP icons `search({category})` browse latency (TS).
0 sync ms by construction — the diet touches only `packages/reference-mcp`
TS, which `packages/reference-rs` cannot reference (Rust-to-TS direction);
whole-sync delta was not measured (off-scope crews ran no sync harness). An
integrator must sum-confirm 0 on the sync denominator before any landing.
Filed so the index grows onto MCP ground, not as a voyage yield.

## Proof (as filed — claims-quoted, crew parked mid-flight)

- Pairs: "timed A/B COMPLETE 8/8 agree (browse med B~374us -> D~1.9us,
  -99.5%, identity 42/42, suites 12/12); lock RELEASED" (claims line 458,
  swarm-catpost worker6).
- Census: `evidence/catpost/catpost-baseline.json` (42 top-level keys —
  captain verified firsthand: 42 keys, 793761 B; the clerk's byte figure
  differed, the keys are exact) + `catpost-census.mjs`; filed census
  19 cats x 2 + 4 edge cases.
- Rigs (archived under `evidence/catpost/`): 600-call browse A/B probe,
  identity script, and the vitest wildcard-vs-postings differential
  (`catpostings.bench.test.ts`).
- Suites as filed: 12/12 green.

## Provenance

No crew REPORT.md survives (the 21 dead worktrees hold roots only); numbers
above are claims quotes + /tmp output files, nothing re-run. Captain
spot-verified firsthand: both diet diffs in place (WT6 +32/-15, WT16
+51/-12), baseline 42 keys, `catpost-B.patch` byte-identical to the /tmp
aside. Base: diets vs `1e1ad31d9` — the tip's rawindex LAND touches the
same file, so an integrator must rebase before any confirm.

## Verdict

**BANK** (off-scope MCP browse surface, captain sign-off as filing —
landing needs integrator re-proof + captain firsthand).
