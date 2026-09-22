# MEMO: pretrim-desc — build-time description pre-trim (PARTIAL)

One line: MCP icons build trims stored descriptions once so the query path reads the stored field as-is; diet + rig + snapshots preserved, but no timing/suite numbers were ever filed and 1 of 148 identity keys differs.

Status: PARTIAL (not a BANK — missing pairs/timing, suites, and identity
resolution; filed so the work survives with its exact gaps).

## Lever

Trim stored descriptions once at build (stored field only; the inverted
index keeps full text); the query path reads the stored field as-is.
Touches `packages/reference-mcp/scripts/build-icons-index.mjs` (+29 trim
fn + stored-field pass) and `src/pipeline/icons-search-index.ts` (trim
call removed). The regenerated `src/data/icons-index.json` is EXCLUDED
from the patch (9.5 MB single-line blob — regenerate via the build
script); `pretrim.patch` is code-only (+34/-12).

## Present (preserved)

- Diet: `pretrim.patch` (WT21 worktree `…01a0c891-7d82-7791-bcc3-1622ab314442`).
- Snapshots: `evidence/pretrim/pretrim-ident-before.json` (1366525 B,
  148 keys) vs `pretrim-ident-after.json` (1366409 B, 148 keys);
  `pretrim-snap-base.json` (37 keys). Sizes captain-verified.
- Rig: `pretrim-harness.mjs` (35-demand battery + bench/snapshot fns),
  `pretrim-base.mjs` (census + 3-rep bench + snapshot writer),
  `pretrim-assert.mts` (12-assertion suite mirror — results NOT filed).
  `pretrim-bench.mts` and the ab/probe scripts referenced a released
  worktree (`…01a0c884-7024…`, gone).

## Gaps (exact — a completing crew must file all three)

1. Pairs/timing numbers as filed: none exist (scripts print to stdout;
   no saved bench output anywhere).
2. Suite results as filed: none (assert mirror exists, never run on record).
3. Identity exception: 147/148 identical; the diff is `cat|action|25` idx 10
   AccountTreeIcon `description` (before full text "…workflow node graphs.",
   after sentence-cut "…lineage lines."). Resolve by proving the cut is
   display-only with zero ranking/readout effect, or narrow the trim.

## Provenance

Crew `pretrim-desc worker13` never posted to claims. Captain verified the
WT21 diff + snapshot sizes firsthand. Base `1e1ad31d9`; rebase needed
(same-file rawindex LAND on tip). Off-scope MCP surface; 0 sync ms by
construction, unmeasured — sum-confirm before any landing.
