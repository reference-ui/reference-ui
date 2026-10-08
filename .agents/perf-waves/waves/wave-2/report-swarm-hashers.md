# swarm-hashers REPORT: hot-path hasher diet (SipHash → Fx)

## Mechanism (one)

Default-hasher (`RandomState`/SipHash-1-3) `HashMap`/`HashSet`/`IndexMap`
maps on bench hot paths → `FxHashMap`/`FxHashSet`/`FxIndexMap`
(`rustc-hash 2`, already a dependency of `atomic` and `base-system`,
added to `module_graph` and `styletrace`). No memo table added anywhere:
every converted site was already hashing on the bench path (wave-1 canon
warning honored — nothing hash-free gained hashing). No logic, capacity,
or API-shape change: pure hasher swaps, `HashMap::new()` →
`FxHashMap::default()`, plus one `FxIndexMap` alias per converted
`IndexMap` file (tokens/condition_map precedent).

Iteration safety (memo R2 rule), audited per site before conversion: all
converted `HashMap`/`HashSet` sites are get/insert/contains/remove-only;
converted `IndexMap`s keep insertion order by construction; `merged`
(`selection.rs`) and `snapshot` (`differential.rs`) sort after collect;
`ordered_unique` (`mint`) sorts after filtering; `literals.kinds` merges
per-kind into sorted sets. One site deliberately EXCLUDED:
`styletrace` `TraceModule.exports` / `ParseState.exports` stay
`RandomState` — `analyzer.rs` iterates `exports.keys()` into walk order,
which feeds diagnostics push order; converting would trade today's
run-random order for a different fixed order (a diagnostics-order behavior
change, not a diet). Cost of the exclusion: ~0.15 ms.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874` (`git rev-parse HEAD`
verified at start; tree clean then).

```
60 files changed, 330 insertions(+), 283 deletions(-)
```

58× `.rs` (all 1–8-line hasher hunks) + `module-graph/Cargo.toml`,
`styletrace/Cargo.toml` (each +1 `rustc-hash = "2"`) + `Cargo.lock`
(2-line edge add; `rustc-hash 2.1.1` already locked, no new crate).
Crates: `atomic` 35 files, `styletrace` 17, `module_graph` 4,
`base-system` 1 (`breakpoints.rs` widths).

Notes:

- `dist/*.mjs` wrappers were missing in the fresh worktree; ran
  `pnpm install` + `build:js` once for harness resolution (gitignored,
  not in diff). `benchmark/reports/latest/*` bench-output noise reverted.
- A temporary criterion decision-bench was written, then reverted
  unused once the static ceiling analysis barred a CUT (see §Counts);
  no residue in the tree.

## Artifacts

- base `.node`: `1bc6891751677be976499ddf270c04df815502fdcc391a9ffefc6b4a9be445c6`
- cand `.node`: `438cd2aeaadcc999debd16611567f80fa3c399bf239142237cfb7e1abb752d75`
- Arms swapped by file copy per run (canon/keys2 precedent); sha256
  verified before AND after every run — 26/26 `ok` (4 warmups + 16
  pair runs + 6 hash runs). Neither binary rebuilt mid-set.

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: **567 + 1 passed, 0 failed**.
  `pnpm agentrs c base_system`: 81 passed. `cargo test -p module_graph`
  (agentrs has no crate mapping for it; ran under the held lock): all
  16 suites green, 0 failed. `pnpm agentrs c styletrace`: 30 passed,
  18 failed — the 18 are pre-existing worktree-environment failures
  (`missing StyleProps declaration entrypoint` in
  `fixtures/sync-root`), proven identical on base via stash
  (base: 29 passed / 19 failed; the ±1,
  `trace_gate::barrel_from_follows_into_import_free_pipeline_target`,
  is a parallel-scratch collision — it passes in isolation on BOTH
  arms). No new reds from this change.
- `pnpm agentrs q` (all 57 touched `.rs` files): **0 code violations**,
  60 pre-existing soft warnings on untouched functions; no touched
  file crosses a length gate from these hunks (nearest: `jsx_attrs.rs`
  at 364 lines, under the 365 warn line).
- (b) Byte-identical outputs base vs cand on all four scales
  (cssCalls/bytes also exact):

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) | `718d19e4…378918` (214,466 B) |
| small      | `ecdec1e8…bda2973` (92,651 B)  | `ad9194f4…e994d41` (91,030 B)       |
| medium     | `37f2ef5b…04819fe` (348,780 B) | `54735e4d…08cfe7ce` (110,241 B)     |
| churn      | `1aad4978…deb10ec05` (8,289,806 B) | `e1349305…f70103f18cdb` (103,709 B) |

All eight match the wave-1 filed hashes character-for-character
(enterprise full strings verified against `report-swarm-diag.md`).

- (c) Determinism: all 20 enterprise kept runs (4 warmups + 16 pair
  runs, both arms) hash-identical to each other on both files.

## Mechanism counts (not just ms)

Static op census over the frozen seed-7 enterprise load (3000 style +
12000 dead files, 7527 css calls). Op volumes from sibling measured
counts where they exist (keys2 decl/exact corpus, diag fact census,
modgraph call counts, shot2 file census), else bounded from committed
generator templates (component/recipe import shapes, 30 shards) plus
code drivers; per-op savings from a SipHash-vs-Fx cost model keyed by
key size (59B ~35ns, paths ~35ns, tuples ~40ns, short ~20ns, tiny
~20ns — generous; keys2 measured FxHash at 20–21ns on the same 59B
lookup keys on this box).

| site | ops | key type | hasher before → after | est. save |
| --- | --- | --- | --- | --- |
| builder `seen_keys` | 35,426 ins | String ~59B | SipHash → Fx | ~1.24 ms |
| proof `exact_set` | 35,426 ins | String ~59B | SipHash → Fx | ~1.24 ms |
| ladder `ProbeMemo` ×4 | ~50k probes | path ~60B | SipHash → Fx | ~1.8 ms |
| resolver `origins` | ~8k get+ins | (ModuleKey,String) | SipHash → Fx | ~0.36 ms |
| resolver `valued` | ~8k get+ins | BindingOrigin | SipHash → Fx | ~0.32 ms |
| `resolve_file_imports` collect | ~4.1k ins | String short | SipHash → Fx | ~0.11 ms |
| resolver refined/programs/etc | ~8k | ModuleKey | SipHash → Fx | ~0.24 ms |
| `AtomicFs` content index | ~3–18k gets | path | SipHash → Fx | ~0.1–0.6 ms |
| `BreakpointScale.widths` | 28,662 probes | 2–3ch | SipHash → Fx | ~0.5 ms |
| emitter `groups` | 9,057 entry | (Vec<String>,String) | SipHash → Fx | ~0.32 ms |
| mint `seen` | ~35k ins | TwinKey tuple | SipHash → Fx | ~1.05 ms |
| analysis `style_props` | ~40–60k contains | short | SipHash → Fx | ~0.7–1.1 ms |
| staging `stages`+census | ~31k | ModuleKey | SipHash → Fx | ~0.9 ms |
| hosts `staged` | ~20k ins+gets | PathBuf | SipHash → Fx | ~0.65 ms |
| sources `known` | 15,122 ins | String path | SipHash → Fx | ~0.53 ms |
| walk `cache` | ~9k | tuple | SipHash → Fx | ~0.36 ms |
| styletrace caches+maps | ~20k | mixed | SipHash → Fx | ≤1.0 ms |
| selection/index/merged | ~4k | mixed | SipHash → Fx | ~0.15 ms |
| bindings sets | ~20k | short | SipHash → Fx | ~0.4 ms |
| graph records + loader maps | ~24k | ModuleKey | SipHash → Fx | ~0.7 ms |
| identity index+memo | ~5k | path | SipHash → Fx | ~0.15 ms |
| scope `stripped` | ~10k | tuple | SipHash → Fx | ~0.25 ms |
| shadows slices | ~20k | short | SipHash → Fx | ~0.3 ms |
| recipes observed / table seen / literals / assembly | ~4k | mixed | SipHash → Fx | ~0.1 ms |
| **total** | **~400k hash ops** | | | **~12–14 ms realistic** |

Fantasy ceiling (all hashing → zero cycles, impossible): ~17.6 ms —
clears BOTH prongs (≥15 ms and ≥1.5% ≈ 17.5 ms), so the ceiling does
NOT bar and a fast CUT was refused; the stack had to be built and
measured. Flame cross-check (`enterprise-flame3`): `hash_one` 18wt
incl / `sip::write` 9wt self / `hashbrown::insert` 29wt incl bound all
hashing at ~17–18wt, consistent with the static total.

Deliberately untouched (0 bench ops, third-party, or order risk):
`model.exports` (diagnostics-order iteration, §Mechanism), `serde_json`
`Map`s + oxc internals (third-party hashers), fonts/extends/virtualrs/
atlas/tasty/typegen (no bench-path calls), recipe `IndexMap`s (~0.03
ms, shared-type churn), walker rules (negligible), `lower` cycle sets
(config-time), `MemoryFs` (tests/virtual only).

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm, then 8
pairs alternating order (B/C, C/B, …) under one lock hold. No sha
mismatch on any run; cssCalls 7527 on all 20 runs.

Warmups (unscored): base 1187.50, 1179.71; cand 1152.65, 1153.46.

| pair | base syncMs | cand syncMs | Δ ms   | Δ %   |
| ---- | ----------- | ----------- | ------ | ----- |
| 1    | 1191.15     | 1171.95     | −19.20 | −1.61% |
| 2    | 1215.91     | 1162.74     | −53.17 | −4.37% |
| 3    | 1179.40     | 1157.74     | −21.67 | −1.84% |
| 4    | 1171.28     | 1160.76     | −10.52 | −0.90% |
| 5    | 1170.72     | 1166.19     | −4.54  | −0.39% |
| 6    | 1114.99     | 1177.03     | +62.03 | +5.56% |
| 7    | 1176.05     | 1183.45     | +7.40  | +0.63% |
| 8    | 1174.76     | 1172.06     | −2.70  | −0.23% |

- base median: **1175.41 ms**; cand median: **1169.07 ms**
- median Δ: **−6.34 ms (−0.54%)**, 6 of 8 pairs favor candidate.
- Excluding pair 1: median Δ **−8.57 ms (−0.73%)** — result stands.
- Median of pair deltas: −7.5 ms. All three estimators agree on a
  consistent ~−6…−9 ms diet effect; pair 6 is a fast-base outlier
  (the cand arm shows no symmetric fast run).

Other scales, single samples each (directional only — reported for
completeness with their hashes in §Correctness, not claimed):
small 151.11 → 88.08 (base cold-start outlier, canon precedent),
medium 230.50 → 223.31, churn 2545.17 → 2507.64.

Honest note: measured ~−7 ms sits below the static ~12–14 ms
realistic estimate — the per-op cost model was generous (and pair 6
costs ~1 ms of median). The direction is consistent across 6/8 pairs
and all estimators; the magnitude does not clear a solo LAND. That is
exactly the proven-identical-diet BANK case.

## Collision / scope notes (for the captain)

- TEXTUAL overlaps with banked-but-unlanded `parse.patch` (same files,
  disjoint small hunks — this crew's hunks are 1–3-line type swaps,
  trivially rebaseable): `extract/identity.rs`,
  `hosts/mod.rs`, `styletrace/.../analyzer.rs`, `.../surface.rs`,
  `.../parser/mod.rs`. No overlap with `canon2.patch` (canon only),
  `diag.patch` (`channels/mod.rs` only), `keys2.patch`
  (`facts.rs`/`serializer.rs`), or `cascade.patch` (`cascade/mod.rs`;
  this crew's emitter hunk is in `emitter/mod.rs`, CUT ground anyway).
- Adjacent ground (untouched): key serialization (swarm-keys2),
  realloc census (swarm-realloc — `reserve_rehash`/`RawTable::drop`
  share these maps but are a different mechanism), canon remainder
  (canon2), cascade sort (cascade), diagnostics partition (diag).
- `model.exports` exclusion (§Mechanism) is the one site a follow-up
  must NOT "complete" without a diagnostics-order determinism audit.

## Verdict

**BANK (hasher diet −6.3 ms / −0.54% full, −8.6 / −0.73% ex-run-1,
6/8 pairs favor, byte-identical 4/4 scales, determinism 20/20,
suites green-or-pre-existing, q 0 violations)**
