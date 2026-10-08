# swarm-sortshape REPORT: cascade sort-shape redesign (unstable sort / prefix bucketing)

## Mechanism (one, attempted then killed)

Future-work note from swarm-cascade's filed verdict: the remaining sort cost is
362k integer compares + string memcmps with no further redundancy to memo — a LAND
here needs a different sort shape, not a bigger memo. Candidate redesigns of the
stable `driftsort` over `(CascadeKey, cmp_whens)` in
`atomic::stylesheet::cascade::write_utilities`:

1. **Unstable sort** (`sort_unstable_by`) plus a CONTENT tiebreaker (`important`,
   class stem). Changes equal-order semantics — needs the tie census + byte proof.
2. **Prefix bucketing**: partition by the integer key prefix
   `(bucket, at_kind, width, selector, property)` (order-preserving under the
   lexicographic `Ord`), sort within groups. No semantic change, but only pays if
   groups are small and balanced.

Both die before the timed bench, on two INDEPENDENT triggers (§Verdict). No
candidate was built; no timed pairs were run.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874`
(`git rev-parse HEAD` verified at start and at close; tree = wave-1 landing
`0a7330c76` plus a docs-only filing).

```
zero diff — instrumentation reverted, bench byproducts reverted, tree clean
```

Final `git status`: clean except this untracked REPORT.md. (`dist/*.mjs` wrappers
were missing in the fresh worktree; ran `build:js` once, gitignored, not in diff.)

## Artifacts

- No base/cand `.node` pair: CUT before the timed bench per protocol (no A/B to arm).
- Count build (temporary tie-census instrumentation, reverted after one run):
  `aeff42dcfbe3a5c9ac34af36a5285a7ee6450c6be8f18ba54e79fdd03e684871`
  (`/tmp/sortshape-count.node`, loaded via `REFERENCE_UI_NATIVE_PATH` override).
- Bench lock held once for the count block (install + build:js + count build +
  one untimed enterprise run), released immediately after in two steps.

## Correctness

- (a) `pnpm agentrs c atomic` on the final (reverted, base-identical) tree: **PASSED**.
  `pnpm agentrs q`: nothing to check — zero touched files in the final tree.
- (b) Byte-identity: no code change, so no 4-scale proof is owed. Side evidence the
  census run itself was output-clean: the instrumented run emitted
  `cssBytes = 2,867,925`, exactly the wave-1 filed enterprise byte count
  (instrumentation wrote only to the `/tmp/sortshape-census.txt` side channel).
- (c) Determinism: the census counts replicate swarm-cascade's filed counts EXACTLY
  (`cmp=362743`, `key_ties=1399`, `N=23505`) across independent builds/runs —
  the count path is deterministic.

## Mechanism counts (the whole case)

One untimed enterprise run (`--scale enterprise --runs 1 --keep --json`, seed 7),
verbatim census line:

```
N=23505 cmp=362743 key_ties=1399 full_pairs=67 tie_groups=67 max_group=2
div_imp=0 div_sel=67 div_decl=0 div_wraps=0
intprefix_groups=84 largest=4496 est_bucket_cmps=228241
```

### Tie census (memo §4 E4 method)

- Full-comparator (`CascadeKey` + `cmp_whens`) ties: **67 pairs in 67 groups,
  max group size 2** (no triples).
- Tied-pair byte-equivalence: **67/67 pairs DIVERGE — all in the selector**,
  `div_sel=67`, `div_decl=0`, `div_wraps=0`, `div_imp=0`.
- First divergent pair (representative of all 67):
  `prop=borderRadius/… imp=false/false`
  `sel=.bench-enterprise__rounded_11/.bench-enterprise__rounded_11px`
  `decl=border-radius: 11px;/border-radius: 11px;` (identical) `wraps=[]/[]`.
- Root cause (predicted statically, confirmed empirically): `CssValue::Token
  { path: "11", value: "11px" }` vs `CssValue::String("11px")` — identical
  `css_value_str` (what the comparator keys on) but different `class_name_str`
  (what the selector prints). The comparator is blind to `class_name_str`,
  `important`, and `When` internals; the emitter is not.

Consequence: tied pairs emit DIFFERENT rules, so any order-changing sort
(unstable sort, parallel sort, reordered bucketing) shifts output bytes with no
content tiebreak able to reproduce the base order (stable sort over `FxHashSet`
iteration order). **Ties diverge unsalvageably** — CUT trigger #2, and the E4
answer for Shot 3 slice 5: B4 keeps the serial stable sort with N-independent
input order; render-parallel only.

### Ceiling (sort 14 wt + memcmp share)

Filed `enterprise-flame3` (compile scope, wt ≈ ms), re-verified by direct
`--inspect` this session: `write_utilities` incl 51 → `driftsort_main` **14 wt**,
of which the sort closure is 13 incl = 8 self + 5 wt memcmp (cascade's filed
breakdown, consistent with the frames). Wave-1 emit removed the selector/format
slices but never touched the sort, so 14 wt stands on the current base.

- 100% sort elimination = ~14 ms < **15 ms** bar, and 14/1186 = 1.18% < **1.5%**
  (≈17.8 ms) bar. The ceiling bars at 100% capture — CUT trigger #1.
- Realistic unstable-sort capture: pdqsort/ipnsort keep (or grow) the 362k
  compares; savings are merge/allocation/data-movement only, optimistically
  ~25% of sort ≈ **3–4 ms**, ~5× below bar.
- Realistic bucketing capture: 84 integer-prefix groups but the largest holds
  4,496 of 23,505 atoms; Σ n·log2(n) = 228k vs 362k actual (−37% of compares).
  But within-group compares skip the cheap integer prefix and go straight to
  prop/value memcmp (the expensive part), plus an extra O(N) pass + hashmap +
  dispatch overhead. Net optimistic ≈ **1–2 ms**, with regression risk.

Even stacking both shapes' optimistic captures (~5 ms) lands at one third of
the bar — and trigger #2 bars the unstable shape regardless.

## Enterprise A/B

None — CUT before the timed bench per the brief ("the ceiling bars → CUT fast
without touching the bench"). No pair table, no medians; the instrumented count
run's syncMs (1548, cold + counting overhead) is not a verdict number.

## 4-scale output-hash table

Not applicable — zero code change, nothing to prove identical. (Instrumented-run
bundle size matched the filed enterprise bytes exactly; see §Correctness (b).)

## Collision (STACKING)

No code changed, so no textual or behavioral collision with swarm-cascade's
banked diet (fused `scan_conditions`, rank memo, lazy `then_with`) is possible.
Design note for the record: the unstable-sort shape, had it survived, would have
applied on top of the banked diet untouched (same comparator the diet makes
lazy); the bucketing shape would have MOO
...[truncated 1169 chars]