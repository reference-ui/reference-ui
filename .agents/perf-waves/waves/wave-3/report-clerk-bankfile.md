# Clerk BANKFILE REPORT — six unfiled off-scope BANKs, MCP icons-search swarm

Paper-only filing inventory. No code, no benches, no diets, no timing runs.
Base-pin verified: `git rev-parse HEAD` = `4720da9dfd21ce8a57b066699eeb0cb6365efc29` (match, 2026-09-22).
All sources read-only: `/tmp/swarm-claims.md`, 21 dead worktrees pinned at `1e1ad31d9`,
`/tmp` asides, `docs/perf/waves/wave-3/`. No writes except this file + two claims lines.
The raw-index LAND is already filed (`docs/perf/waves/wave-3/report-swarm-rawindex.md` +
perf index) and is not re-litigated below.

## Grounding (index searches first)

- `pnpm agentperf search icons` → 1 match: **PERF-W3-RAWINDEX [LAND]**
  (raw-index-load, −160.3 ms/−53.3%, 8/8). The filed LAND; excluded from BANKs.
- `search catpost` / `prelower` / `demand` / `dedupe` / `trim` / `raw-index` /
  `wave-3` → **0 matches each** (85 entries, index built 2026-09-22T10:58:46Z).
- `stats`: waves {log:10, wave-1:6, wave-2:66, wave-3:3}; wave-3 = rawindex LAND +
  repro3 + recipeproof only. **All six BANKs confirmed unfiled** (no index id, no
  report under `docs/perf/waves/wave-3/`).

## Claims enumeration (`/tmp/swarm-claims.md`, 472 lines at START)

Verdict lines per crew (grep `verdict`, case-insensitive): wave-1/2 crews hold all
LAND/BANK/CUT verdicts except the post-park MCP section, lines 456–471, which names
8 crews: `swarm-catpost`, `swarm-prelower5`, `swarm-reusesearchopts`,
`raw-index-worker1`, `prebuilt-categories`, `dedupe-indexed-fields`,
`raw-index-replica`, and `pretrim-desc worker13` (mentioned, never posts).
MCP verdicts as filed: LAND ×2 (raw-index worker1 + replica, same lever),
CUT ×2 (`swarm-reusesearchopts` lottery; `prebuilt-categories` 0.26 ms).
`swarm-catpost` and `swarm-prelower5` posted complete numbers but no verdict line
(parked mid-flight). No crew REPORT.md survives in any dead worktree
(roots hold only AGENTS/LOG/README/SECURITY/VOYAGE.md; `git status` shows no
untracked REPORT anywhere in any of the 21).

## How the six were identified (inference, stated plainly)

No source names the six BANKs (VOYAGE.md cites the count only; wave-3 archive
predates the swarm; index has no stubs). Ranking all 14 levers by BANK
completeness (counts + pairs + identity + suites as filed, identity sound)
yields exactly six above the cut; the rest are LAND-filed (raw), CUT
(reuse-opts, prebuilt-cats), identity-breaking (exact-first, dedupe-indexed-fields,
desc-drop), or diet-only remainder (verbose-cache). Details in “Examined,
not BANKs”.

Worktree path prefix (all 21 dead): `P = /Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-`

---

## BANK 1 — swarm-catpost / category-postings browse

- Crew: `swarm-catpost` (claims; “worker6”). Lever A in `P + 01a0c87c-934a-7590-a7b8-c75ef40b84c6`
  (WT6); second crew’s diet in `P + 01a0c88b-c44b-7053-9bbc-79b2530f5670` (WT16).
- Lever: prebuilt category→entries postings; category browse skips MiniSearch
  wildcard entirely. Surface: `search({category})` browse path,
  `packages/reference-mcp/src/pipeline/icons-search-index.ts` (TS/MCP search path).
- Numbers AS FILED (claims line 458, quoted): “timed A/B COMPLETE 8/8 agree
  (browse med B~374us -> D~1.9us, -99.5%, identity 42/42, suites 12/12); lock RELEASED”.
- Artifacts (exact paths):
  - Diets: WT6 `git status` = `M icons-search-index.ts` (+32/−15,
    `categoryPostings` + `allPostings`); WT16 = `M icons-search-index.ts`
    (+51/−12, `categoryIndex` + dedupe-keys).
  - `/tmp/catpost-diet.ts` (9987 B) — byte-identical to WT6 file (diff clean).
  - `/tmp/catpostings.patch` (3565 B) — matches WT16 tree
    (`index afcaba7d5..6bbecf50a`, same blob).
  - `/tmp/catpost-bench.mjs` (1269 B, 600-call browse A/B probe),
    `/tmp/catpost-census.mjs` (3288 B), `/tmp/catpost-identity.mjs` (1323 B),
    `/tmp/catpostings.bench.test.ts` (3646 B, vitest wildcard-vs-postings differential).
  - `/tmp/catpost-baseline.json` (2357897 B, 42 top-level keys as read —
    matches filed 42/42: 19 cats × 2 + 4 edge cases).
- Status: **FILED-READY** (counts in baseline snapshot + census script; pairs 8/8,
  identity 42/42, suites 12/12 all as filed in claims).

## BANK 2 — swarm-prelower5 / lower-once-at-load category filters

- Crew: `swarm-prelower5` (claims). Lever A in `P + 01a0c87c-8efa-79d2-86f8-99b5932a379f`
  (WT5); second crew’s diet in `P + 01a0c88b-c008-7ff3-853a-18268a8e7387` (WT15).
- Lever: lowercase stored categories once at load; hot filters use plain `===`
  (no per-candidate alloc). Surface: ctor + `searchDemand`/`search` filter path,
  `packages/reference-mcp/src/pipeline/icons-search-index.ts`.
- Numbers AS FILED (quoted): line 459 — “baselines already captured lock-free x3
  (lowers 4978/549 exact, browse ~0.41ms, identity 17c0bece4865ea98)”;
  line 461 — “after x2 browse ~0.357ms lowers 1, demand ~1.53ms lowers 4,
  identity match, 12/12 tests green” (+ “lock RELEASED (two-step)”).
- Artifacts:
  - Diets: WT5 `M icons-search-index.ts` (+12/−4, in-place lower);
    WT15 `M icons-search-index.ts` (+4/−2, `.map` lower).
  - `/tmp/prelower-diet.ts` (9805 B) — byte-identical to WT5 file.
  - `/tmp/prelower-bench.mjs` (3152 B — lowers census via toLowerCase counter +
    interleaved browse/demand medians + 16-hex identity hash).
- Status: **FILED-READY** (counts lowers 4978/549 ×3; pairs before ×3 + after ×2;
  identity hash match; suites 12/12 — all as filed in claims).

## BANK 3 — pretrim-desc worker13 / build-time description pre-trim

- Crew: `pretrim-desc worker13` (named once, claims line 468; never posts).
  Work split across released worktree `…01a0c884-7024-79f1-906d-b1b948b7baef`
  (probe/base scripts; **gone** from `git worktree list`) and live
  `P + 01a0c891-7d82-7791-bcc3-1622ab314442` (WT21, diet + bench/assert).
- Lever: trim stored descriptions once at build (stored field only; inverted
  index keeps full text); query path reads stored field as-is.
  Surface: `packages/reference-mcp/scripts/build-icons-index.mjs` (build) +
  `searchDemand`/browse readout path (TS).
- Numbers AS FILED: **none** — no claims lines, no saved bench output
  (all scripts print to stdout). Filed data artifacts only (sizes as read):
  `/tmp/pretrim-snap-base.json` (197152 B, 37 keys); `/tmp/pretrim-ident-before.json`
  (1366525 B, 148 keys) vs `/tmp/pretrim-ident-after.json` (1366409 B, 148 keys):
  147/148 identical as read; the 1 diff is `cat|action|25` idx 10 AccountTreeIcon
  `description` (before = full text “…workflow node graphs.”, after = sentence-cut
  “…lineage lines.”) — an identity exception the filing must resolve.
- Artifacts:
  - Diet: WT21 `git status` = `M build-icons-index.mjs` (+29 trim fn + stored-field
    pass) + `M src/data/icons-index.json` + `M icons-search-index.ts` (trim call
    removed); 3 files +34/−12.
  - `/tmp/pretrim-harness.mjs` (35-demand battery + bench/snapshot fns),
    `/tmp/pretrim-base.mjs` (census + 3-rep bench + snapshot writer),
    `/tmp/pretrim-bench.mts` (WT21; ident capture + limit 5/25/100 medians +
    trim-surgery microbench), `/tmp/pretrim-ab.mjs`, `/tmp/pretrim-ab100.mjs`,
    `/tmp/pretrim-probe.mjs` (all point at gone-7024), `/tmp/pretrim-assert.mts`
    (12-assertion suite mirror, results not filed).
- Status: **PARTIAL** — missing: pairs/timing numbers as filed; suite results as
  filed; resolution of the 1/148 identity diff. (Counts-method + snapshots +
  diet present.)

## BANK 4 — demand-memo / searchDemand LRU cache (crews unnamed, no claims)

- Crew: no claims handle; two diets: `P + 01a0c87c-977b-7ee3-8430-2042be652567`
  (WT7, copy-on-return) and `P + 01a0c88b-c8fb-7600-94d2-00ae83459eab` (WT17,
  returns cached ref).
- Lever: 64-entry LRU memo of `searchDemand` (key = demand+limit+category+verbose).
  Surface: `searchDemand` hot path, `icons-search-index.ts`.
- Numbers AS FILED: **none** — no claims lines, no saved outputs (scripts print
  to stdout; no snapshot/identity files).
- Artifacts:
  - Diets: WT7 `M icons-search-index.ts` (+19/−1); WT17 `M icons-search-index.ts`
    (+21/−1). Both uncommitted, recoverable in place.
  - WT7 rig: `/tmp/demand-bench.mjs` (repeat/batch/unique/single benches +
    determinism probes), `/tmp/demand-miss.mjs` (always-miss + cold-cost probes),
    `/tmp/demand-identity.mjs` (25-case identity + cache-POISON mutation probe,
    prints JSON — output not saved).
  - WT17 rig: `/tmp/demand-memo-bench.mjs` (distinct/repeat/catverb/dup-batch +
    key-separation + eviction probes), `/tmp/demand-memo-miss.mjs` (all-miss probe).
- Status: **PARTIAL** — missing: counts, pairs, identity outputs, suites
  (all four as filed). Present: two diets + complete method rig.

## BANK 5 — lazy-singleton / defer index inflate to first search (crews unnamed)

- Crew: no claims handle; two diets: `P + 01a0c87c-81bb-77e3-95f8-b6ab18182ad5`
  (WT2, `cachedEngine`) and `P + 01a0c88b-b2dd-7d51-805a-eb367397107a` (WT13,
  `engineInstance`); both rewire `icons-catalog.ts`
  (`searchEngine` → `getSearchEngine()`, `ICON_CATEGORIES` → `getIconCategories()`).
- Lever: lazily construct the singleton so non-search tool imports pay zero
  index inflate (~5 MB / ~100 ms ctor per in-tree comments).
  Surface: module import path — `icons-search-index.ts` singleton +
  `icons-catalog.ts` call sites (MCP import latency).
- Numbers AS FILED: **none** — no claims lines, no saved timing output
  (`/tmp/bench-icons/err-before.txt` and `err-after.txt` are both 0 bytes).
  Identity pair filed: `/tmp/bench-icons/out-before.json` and `out-after.json`
  (36749 B each, sha1 `cb3aea03fe540a6dec0138592954ba0237e2dc2e` both — identical).
- Artifacts:
  - Diets: WT2 (3 files +15/−6: search-index + catalog + test);
    WT13 (3 files +21/−6: search-index + catalog + test).
  - `/tmp/bench-icons/` rig: `before/` + `after/` full-src arms (arms differ),
    `probe-import.mjs` (fresh-process importMs + heap), `probe-func.mjs`
    (11-case battery incl. `singletonSame` + `docCount`), `breakdown.mjs`
    (ctor cost-split: read/parse/stringify/loadJSON/catscan).
  - `/tmp/icons-cost-split.mjs`, `/tmp/icons-import-time.mjs`,
    `/tmp/icons-battery.mjs` (importMs + resultsHash + catHash battery),
    `/tmp/icons-search-index.cached.ts` (10050 B), `/tmp/icons-search-index.AFTER.ts`
    (9329 B) — variant asides, match neither WT2 nor WT13 exactly (diffs non-empty);
    `/tmp/icons-before.mjs` + `/tmp/icons-after.mjs` (6.1 MB bundles, sizes only).
- Status: **PARTIAL** — missing: pairs/timing numbers and suites as filed.
  Present: two diets, both bench arms, byte-identical identity pair.

## BANK 6 — sqfp / single-query extractDemands fastpath (crews unnamed)

- Crew: no claims handle; two diets: `P + 01a0c880-8f31-70a2-81be-9c0d486d6061`
  (WT8, gate inside `extractDemands`) and `P + 01a0c88e-828e-77c1-b647-65f7e706a8db`
  (WT18, gate at the `search()` call site).
- Lever: gating regex proves the sentence/clause/regex pipeline is identity for
  single queries; `extractDemands(q)` returns `[q]` directly.
  Surface: `extractDemands` + `search()` demand-splitting path, TS.
- Numbers AS FILED: **none** — no claims lines, no saved bench output.
  Identity pair filed: `/tmp/sqfp-snap-before.json` and `/tmp/sqfp-snap-after.json`
  (148961 B each, sha1 `423e78294530afb246b802f75ddde31d57be597c` both; 63/63 keys
  identical as read).
- Artifacts:
  - Diets: WT8 `M icons-search-index.ts` (+14); WT18 `M icons-search-index.ts`
    (+14/−2). Both uncommitted, recoverable in place.
  - `/tmp/sqfp-bench.mjs` (WT8; singles/multis/arrays extract bench),
    `/tmp/sqfp-diff.mjs` (WT8), both snapshot JSONs above.
- Status: **PARTIAL** — missing: counts, pairs, suites as filed.
  Present: two diets, bench/diff rig, 63/63 identical identity pair.

---

## Examined, not BANKs (with reasons)

- **raw-index-load (WT1 ?raw + WT12 loadJS+scoped plugin)** — already LAND-filed
  (PERF-W3-RAWINDEX + report); out of scope for this pass per brief.
- **reuse-search-opts (WT4 + WT14)** — CUT by verdict (claims 464: “interleaved A/B
  x2 + lottery control … verdict CUT (lottery)”). Asides `/tmp/reuse-search-options.ab.mjs`
  + `.bench.mjs` exist but the lever is closed.
- **prebuilt-categories (WT3 + cat-bench rig + `/tmp/catsnap-before.json` ==
  `/tmp/catsnap-after.json`, sha1 `c05b8fb6…`, 47082 B)** — CUT by verdict
  (claims 466: “delta ~0.26ms; below 15ms/1.5% LAND bar and 5ms floor”).
- **exact-first staging (WT9 + WT19)** — identity-breaking: `/tmp/exact-first-before.txt`
  vs `-after.txt` (1822/1814 B) show 5/43 top-1 flips (calendar/clock/person/play/file)
  despite bench medians improving (12.18→3.29 ms limit=2); CUT-shaped, not bankable
  as-is. Scripts: `exact-first-probe/rank/real.mjs`, `exact-first-probe.diff`.
- **dedupe-indexed-fields (released worktree `…01a0c88f-eddf-7340-8d25-b423562d987a`,
  gone)** — no recoverable diet; filed probe DISCARDED unlocked (claims 467);
  `/tmp/dedupe-battery.baseline.json` vs `.probe.json` differ on 31/54 keys
  (ranking flips, totals same) — identity-breaking. Scripts + snapshots survive
  (`dedupe-census/battery/probe/latency.mjs`, `dedupe-base-index.json`) but the
  lever needs a rebuild, not a filing.
- **desc-drop description field (WT10 + WT20, identical diets)** — diet-only +
  scripts (`desc-drop-probe/verify.mjs`); no saved numbers/identity; field removal
  changes scores by construction (same class as dedupe/exact-first). Remainder.
- **verbose-readout-cache (WT11)** — diet + `/tmp/verbose-probe.diff` (matches WT11
  blob `fcf3ac17b`) + `verbose-bench.mts`/`verbose-micro.mjs`; no saved outputs of
  any kind. Diet-only remainder, below the six on identity evidence.
- **fuzzy-gate probe** (`/tmp/fuzzy-gate-bench.mjs`, `fuzzy-gate{3,3b,5,5b}.json`
  with per-query medians/top1, `/tmp/fuzzybench/`) — probe-only, no diet in any
  worktree; supporting evidence at best, not a lever filing.

## Dead-worktree roster (21, all pinned `1e1ad31d9`, all dirty, none with REPORT)

| # | suffix | lever | files |
|---|---|---|---|
| WT1 | 01a0c87c-7d02-7ae1-a14c-87a4642531c4 | raw-?raw | search-index + tsup + raw-text.d.ts |
| WT2 | 01a0c87c-81bb-77e3-95f8-b6ab18182ad5 | BANK lazy-A | search-index + catalog + test |
| WT3 | 01a0c87c-8621-7953-ac65-241ce75e89bc | prebuilt (CUT) | build + index.json + search-index + new test |
| WT4 | 01a0c87c-8aaa-7602-88ba-80eb69733bab | reuse-A (CUT) | search-index |
| WT5 | 01a0c87c-8efa-79d2-86f8-99b5932a379f | BANK prelower-A | search-index |
| WT6 | 01a0c87c-934a-7590-a7b8-c75ef40b84c6 | BANK catpost-A | search-index |
| WT7 | 01a0c87c-977b-7ee3-8430-2042be652567 | BANK demand-A | search-index |
| WT8 | 01a0c880-8f31-70a2-81be-9c0d486d6061 | BANK sqfp-A | search-index |
| WT9 | 01a0c880-c9bf-7c12-bcbb-d8048bfef29a | exact-A (ident-break) | search-index |
| WT10 | 01a0c884-1e77-7d23-b60c-73c253af715c | desc-drop-A | build + index.json + search-index |
| WT11 | 01a0c885-59f7-70a0-ac8a-5df9186c70d0 | verbose (remainder) | search-index |
| WT12 | 01a0c88b-aca5-7842-b2a0-9b5c5d5936c5 | raw-loadJS (LAND-filed) | search-index + tsup |
| WT13 | 01a0c88b-b2dd-7d51-805a-eb367397107a | BANK lazy-B | search-index + catalog + test |
| WT14 | 01a0c88b-bbcd-7c20-8cdc-f39b85c5014b | reuse-B (CUT) | search-index |
| WT15 | 01a0c88b-c008-7ff3-853a-18268a8e7387 | BANK prelower-B | search-index |
| WT16 | 01a0c88b-c44b-7053-9bbc-79b2530f5670 | BANK catpost-B | search-index |
| WT17 | 01a0c88b-c8fb-7600-94d2-00ae83459eab | BANK demand-B | search-index |
| WT18 | 01a0c88e-828e-77c1-b647-65f7e706a8db | BANK sqfp-B | search-index |
| WT19 | 01a0c88e-dc6a-7002-aa7a-0c408738a86a | exact-B (ident-break) | search-index |
| WT20 | 01a0c890-d38c-73b1-97f3-ede3368894e7 | desc-drop-B | build + index.json + search-index |
| WT21 | 01a0c891-7d82-7791-bcc3-1622ab314442 | BANK pretrim | build + index.json + search-index |

Released (referenced by asides, absent from `git worktree list`):
`…01a0c884-7024-79f1-906d-b1b948b7baef` (pretrim probes) and
`…01a0c88f-eddf-7340-8d25-b423562d987a` (dedupe crew — diet unrecoverable).
`git stash list` holds only 2 unrelated entries (untouched).

## Clerk notes

- No REPORT.md, INTEGRATE.md, or verdict file exists for any BANK anywhere
  searched (21 worktree roots + `/tmp` + wave-3 dir). “Numbers AS FILED” above
  are claims quotes and `/tmp` output files only; nothing was re-run or re-timed.
- Off-scope MCP ground has no voyage BANK bars (VOYAGE bars are sync-ms);
  statuses judge artifact filability only, not the verdict.
- If the captain’s six differ from this inference, the first-line substitutes
  are verbose-cache (diet + diff + rig, zero outputs) and desc-drop (diets +
  scripts, identity suspect); dedupe and exact-first are identity-barred.

CLERK-VERDICT: 2-FILED-READY 4-PARTIAL 0-LOST
