# swarm-reusesearchopts REPORT: reuse searchDemand options object (lottery CUT)

One line: MCP searchDemand options-object reuse showed no stable win under interleaved A/B with lottery control; CUT as filed.

Effect: interleaved A/B x2 + lottery control, identity sha a15faabd match (29 KB); verdict CUT (lottery) as posted.

## Mechanism (attempted)

Reuse the options object across `searchDemand` calls to cut allocs.
Crews WT4 (A, `…01a0c87c-8aaa…`) + WT14 (B, `…01a0c88b-bbcd…`), both
`M icons-search-index.ts`. Diets NOT preserved (CUT — no patch;
worktree paths recorded here for possible re-proof).

## Proof of CUT

Claims line 464 (quoted): "timed block COMPLETE (interleaved A/B x2 +
lottery control; identity sha a15faabd match 29KB; icons-catalog 12/12;
other suite fails pre-existing unbuilt rust pkgs); verdict CUT (lottery)".
Asides `/tmp/reuse-search-options.ab.mjs` + `.bench.mjs` exist (not
archived — lever closed).

## Verdict

**CUT** (allocator lottery on MCP search surface; closed — do not
re-litigate without new filed evidence).
