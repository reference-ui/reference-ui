# swarm-prebuiltcats REPORT: prebuilt category counts (sub-floor CUT)

One line: MCP ctor category walk+sort hoist saves 0.26 ms one-time against a ~73 ms ctor; below the 15 ms LAND bar and the 5 ms floor; CUT as filed.

Effect: diet 0.269 ms -> 0.008 ms (-97.0%) one-time, delta -0.26 ms vs ~73 ms ctor (3857 docs, 18 cats); below bars.

## Mechanism (attempted)

Hoist the ctor category walk+sort into prebuilt counts. Crew WT3
(`…01a0c87c-8621…`: build + index.json + search-index + new test).
Diet NOT preserved (CUT — no patch; path recorded for possible
re-proof). Identity pair `/tmp/catsnap-before.json` == `-after.json`
(sha1 `c05b8fb6…`, 47082 B — not archived, lever closed).

## Proof of CUT

Claims line 466 (quoted): "CUT — ctor walk+sort 0.269ms one-time of ~73ms
ctor (3857 docs, 18 cats); diet after 0.008ms, delta ~0.26ms; below
15ms/1.5% LAND bar and 5ms floor; worktree reverted clean."

## Verdict

**CUT** (sub-floor on MCP ctor surface; closed — do not re-litigate
without new filed evidence).
