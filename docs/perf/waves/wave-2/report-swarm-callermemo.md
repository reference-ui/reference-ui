# swarm-callermemo REPORT: caller-side canon memo

## Mechanism (one, attempted then killed)

Memoize canon lookups AT THE CALLERS: per-site memo tables at the 16
`is_known_style_prop` and 13 `resolve_canonical_prop` call sites (27 in
`atomic`, 2 internal in `canon`), instead of inside the lookup. Killed on
the ceiling after an exact per-site census: repeats concentrate
beautifully (99.9% at live sites) but the lookup is too near-floor for
any probe to clear either prong — and the `resolve_canonical_prop` memo
is net-negative by construction (probe ≥10 ns on a 1.4 ns path). No memo
was built; no timed pairs were run.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874`
(`git rev-parse HEAD` verified at start and at close; tree = wave-1
landing `0a7330c76` plus a docs-only filing).

```
zero diff — census instrumentation reverted, bench byproducts reverted, tree clean
```

Final `git status`: clean except this untracked REPORT.md. (`dist/*.mjs`
wrappers were missing in the fresh worktree; ran `build:js` once,
gitignored, not in diff. `node_modules` was absent; `pnpm install` ran
under the count hold with no lockfile/tree collateral.)

## Artifacts

- No base/cand `.node` pair: CUT before the timed bench per protocol.
- Count build (temporary 29-site census instrumentation, reverted after):
  `f4ace0e5d3183504fff48b979e46fd37fe1a871acfa087d03ab7ae42bb6040fa`
  (`/tmp/callermemo-count.node`, loaded via `REFERENCE_UI_NATIVE_PATH`
  override, `sha256sum -c` OK after the count run).
- Bench lock held once for the count block (install + build:js + count
  build + one untimed enterprise run + hygiene suite), released
  immediately after in two steps. (Lost the first race to swarm-extract;
  waiter queued per protocol; no CPU touched while queued.)

## Correctness

- (a) `pnpm agentrs c canon` on the final (reverted, base-identical)
  tree: **55 passed, 0 failed**. `pnpm agentrs q`: nothing to check —
  zero touched files in the final tree.
- (b) Byte-identity: no code change, so no 4-scale proof is owed. Side
  evidence the census run itself was output-clean: the instrumented run
  emitted `cssBytes = 2,867,925` / `dataBytes = 214,466`, exactly the
  filed enterprise byte counts (passthrough wraps return the input `&str`
  unchanged; instrumentation wrote only to `/tmp/callermemo-census.txt`).
- (c) Determinism: the census is an exact counter, not a sample — every
  call counted via a mutex table on the frozen seed-7 load; no sampling
  variance exists. (The count run's syncMs, 1599 cold + counting
  overhead, is not a verdict number.)

## Static cost structure (why the ceiling was always low)

Post-wave-1 per-call costs on the seed-7 load (all filed, none assumed):

- `resolve_canonical_prop(non-alias)` = `maybe_alias` reject + `unwrap_or`
  ≈ **1.4 ns** (wave-1 criterion `alias/miss`). 98.9% of the canonical
  vocabulary rejects the prefilter; the load authors canonical names.
- `resolve_canonical_prop(alias)` ≈ **25 ns** (`alias/hit_hot`).
- `is_reference_prop` miss = binary search over **5** entries
  (`colorMode r size variant weight`) ≈ **~10 ns** (≤3 first-byte-out
  compares; 15 ns granted in the fantasy bound).
- `find_property` hit ≈ **37 ns** (findprop criterion `mixed`).
- `is_known_style_prop(ordinary prop)` ≈ 10 + 1.4 + 37 ≈ **~50 ns**.
- Memo probe floor: Fx hash over ~11 B ≈ 8–11 ns (findprop leg 2; keys2
  *measured* 20–21 ns hash-only on longer keys) + slot index + verify
  ≈ **15–18 ns** realistic, 10 ns granted in the fantasy bound.

## Mechanism counts (the whole case)

One untimed enterprise run (`--scale enterprise --runs 1 --keep --json`,
seed 7), single `## compile 1` block, 580 (site, name) rows. Leg split
classified offline per name: `--*` custom / 5 reference / 315-entry
`ALIASES` / remainder (= `find_property` leg; findprop proved 0 misses
on this load, and this census contains zero uppercase-initial names so
the 5 multi-line `Webkit*` alias entries cannot misclassify).

`is_known_style_prop` — 4 of 16 sites live:

| site | location | calls | distinct | repeats | custom | ref | alias-hit | find leg | top name |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | resolve/mod gate | 89,904 | 46 | 89,858 | 0 | 0 | 11,607 | 78,297 | backgroundColor:3673 |
| 5 | proof render | 35,426 | 46 | 35,380 | 0 | 0 | 4,126 | 31,300 | backgroundColor:1254 |
| 8 | object/mod | 60,326 | 46 | 60,280 | 0 | 0 | 6,897 | 53,429 | backgroundColor:2110 |
| 4 | global value | 44 | 19 | 25 | 0 | 0 | 0 | 44 | scrollBehavior:6 |
| — | dead (0 calls) | 2,3,6,7,9,10,11,12,13,14,15,16 | — | — | — | — | — | — | — |
| **K total** | | **185,700** | | **185,543** | **0** | **0** | **22,630** | **163,070** | |

`resolve_canonical_prop` — 8 of 13 sites live (name classes shown for the
alias/non-alias split; this function never reaches `find_property`):

| site | location | calls | distinct | alias-hit | non-alias |
| --- | --- | --- | --- | --- | --- |
| 21/23/24/25/26 | resolve refuse + 4 shorthand probers (each sees every want) | 89,904 ×5 | 46 | 11,607 ×5 | 78,297 ×5 |
| 22 | token scale | 35,317 | 41 | 7,382 | 27,935 |
| 30 | twin key | 48,566 | 46 | 6,124 | 42,442 |
| 32 | class_prefix | 23,505 | 46 | 2,807 | 20,698 |
| 33 | to_css | 32,606 | 60 | 3,910 | 28,696 |
| — | dead (0 calls) | 27,28,29,31 | — | — | — |
| **C total** | | **589,514** | | **79,258** | **510,256** |

Cross-checks: K find leg 163,070 / findprop's 353,517 = 46% vs the filed
flame split 9/21 = 43% — coherent. The five identical 89,904s are the
per-want resolve chain (gate + refuse + border + pair + dim-router +
flex each pay a canon lookup per want).

## Ceiling (three legs, all bar)

LAND bar on the ~1160 ms base: ≥15 ms **and** ≥1.5% (≈17.4 ms effective).

1. **K fantasy (impossible probe, 100% hits, generous lookup):**
   find leg 163,070 × (48.4−10) + alias 22,630 × (35−10) = 6.26 + 0.57
   = **6.83 ms (0.59%)**. Granting `is_reference_prop` = 15 ns as well:
   **7.76 ms (0.67%)**. Bars both prongs with ~2× margin.
2. **K realistic (15 ns Fx probe, per-site tables):**
   163,070 × 33.4 + 22,630 × 20 ≈ **5.90 ms (0.51%)**, before per-site
   table memory traffic. Bars both with ~3× margin.
3. **C memo (the reverse-keys2 asymmetry):** non-alias lookups cost
   1.4 ns vs a ≥10 ns probe — the memo LOSES 8.6 ns × 510,256 ≈ −4.4 ms
   while alias hits save at most +1.2 ms (fantasy) / +0.8 ms
   (realistic). Net **−3.2 ms fantasy, −6.2 ms realistic: a regression**.
   Only prefilter-gated probing avoids the loss, capping savings at
   79,258 × 15 ns ≈ **1.19 ms fantasy** — barred.

Even both memos together at fantasy-everywhere: 6.83 + 1.19 = **8.0 ms
< 15 ms**. No caller-side memo shape survives: the fantasy bound grants
an impossible probe at 100% hits, and every real shape (Fx, no-hash,
small-vec, last-N inline) does worse on both axes.

## Memo-viability section (caller × name repeat matrix)

- Repeats are NOT diffuse: every live site sees 41–60 distinct names at
  99.8–99.9% repeat rate; the same ~46 prop names recur at every site
  (top name ≈ 4% per site — no single-name inline-cache shortcut).
- Concentration: 76% of C volume is the 5× per-want resolve chain;
  100% of K volume is 3 hot sites (resolve gate, proof render,
  object/mod). 17 of 29 sites are dead (0 calls) on this load — the
  JSX-attr, staticCss-wildcard, builder-slot, harvest-mint, and
  spread-lowering sites never fire on the css()-call seed load.
- Verdict on viability: a memo WOULD hit constantly — the binding
  constraint is per-hit savings (≤38 ns fantasy on a ~50 ns lookup),
  not hit rate. Hit-cost (≥10 ns fantasy, ~15 ns realistic) can never
  open a ≥15 ms gap over 185,700 eligible calls. Diagnosis complete:
  repeats concentrate, ceiling bars anyway.

## Enterprise A/B

None — CUT before the timed bench per the brief ("the ceiling clears
neither prong → CUT fast"). No pair table, no medians.

## 4-scale output-hash table

Not applicable — zero code change, nothing to prove identical.
(Count-run bundle bytes matched the filed enterprise bytes exactly;
see §Correctness (b).)

## Collision

No code changed, so no textual or behavioral collision with anyone is possible.

- Adjacent, cited not relitigated: canon2's banked value-classify (same
  canon chain, different functions); findprop's CUT (this census inherits
  its 353,517-call count and ~37 ns dispatch floor as the starting bound);
  keys2's memo-loses autopsy (the probe-vs-lookup asymmetry template —
  this memo loses by the same template in reverse); swarm-hashers' banked
  Fx conversions (different mechanism — HashMap hashers, not lookup
  memo); swarm-extend's resolve ground (shares `find_property` callers —
  different mechanism; RACE RULE moot, nothing built).
- Observed adjacency for the captain (not mine, one line): every want
  pays FIVE `resolve_alias` lookups in the resolve chain (refuse +
  border + pair + dim-router + flex probers, 89,904 each) — a
  caller-fusion shape that belongs to extend's resolve ground, filed
  here only as a counted fact (449,520 calls: 391,485 non-alias ×
  1.4 ns + 58,035 alias × ~25 ns ≈ 2.0 ms total addressable —
  sub-bar on its own).
- Out-of-scope shape deliberately not pursued: a last-N inline
  micro-cache is strictly dominated by the fantasy bound (which grants
  an impossible probe at 100% hits and still bars).

## Verdict

**CUT (ceiling bars both prongs: exact census K 185,700/C 589,514 over
12 live sites, K fantasy 6.83 ms/0.59%, C memo net-negative by
construction, combined fantasy 8.0 ms vs the ≈17.4 ms effective bar —
counted, never built, no timed bench)**
