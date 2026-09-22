# swarm-bagdefer REPORT: retained-bag first-read deferral (valgraph F1)

## Verdict

**BANK (+7.21ms / +0.74% medians, 6/8 pairs, ex-run-1 +5.63, paired-median
+2.61 — sub-bar both LAND prongs as expected for a ≈1.5ms-fantasy diet;
proven-identical: 4-scale full-sha byte-identity vs sealed pins + sizes,
determinism, suites green-or-same-red, quality 0 violations)**

## Base / sequencing

- Brief pin `ddce131e7ab9a627500b5caa3d24bce81204dfe4` verified at start
  (`git rev-parse HEAD` equal, tree clean); same pin at end, no commits.
- Verdict-gated on swarm-stageaudit (T6, shared `loader.values` shape):
  read census ran pre-verdict (outcome-independent counts, explicitly
  allowed); diet implemented only after their verdict posted.
- Stageaudit outcome read FRESH from their tree: verdict BANK, diet
  +15/-4 (`stream.rs` + `staging.rs`, `StreamedSource::with_bag` fusion).
  Rebase assessment: CLEAN-DISJOINT — `StreamedSource` struct unchanged
  (`bag: LocalConstants` field intact), `AtomicLoader::new` / staged /
  values / `load()` / `from_plan` untouched. This diet stacks onto either
  arm without textual or mechanical overlap (different files/regions).

## Topic (valgraph filler F1, off-backlog)

`ValueGraph::from_plan` collects 3,122 retained literal bags up front, but
reads are ≈119 `collect_origin` clones + uncounted `mutation` probes.
Defer the collect to first read so unread bags skip collect AND drop.

## Read census (exact, enterprise protocol stream, no --seed)

Env-gated `SWARM_BAGDEFER_DUMP` eprintln instrumentation (6 TEMP sites,
reverted before the diet): from_plan collects, load arms, mutation-probe
outcomes, finish_origin clone reads, bag_value reads, collect_origin calls.
3/3 ORDER-IDENTICAL after tempdir normalization (sha `938b8a21bb2e` ×3,
6601 lines each); pins cssBytes 2867925 / dataBytes 214466 ×3.

| counter | count | meaning |
| --- | --- | --- |
| collects | 3122 / 3122 distinct | retained bags built up front (== valgraph staged_ret) |
| loads | 3122, all staged, parse 0 | every retained file loads as a walk start; zero external parses |
| mutprobe | 119, all nomut, 0 hits | every value_uncached probed a loaded bag, none mutated |
| finish | 119, all some | every collect_origin cloned a loaded bag |
| bagvalue | 0 | External path never fires on this corpus |
| collect_origin | 119, all retained | == extend's exact 119 ✓ |

- READ file sets: mutprobe == finish == collect_origin (119 files, 1
  binding each). reads ⊆ loads ⊆ collects, all verified per-file.
- UNREAD: **3003 bags, ALL loaded-but-unread** (never-loaded 0).
- Consequences filed from counts: load-time deferral (collect in
  `load()`) is VOID (loads == 3122 saves ~nothing); the literal
  collect-inside-`collect_origin` sketch is UNSOUND in general (R1
  mutation probes reach `loader.bag` BEFORE the file's first
  collect_origin per `value_uncached` order — corpus has 0 hits but a
  mutated-import corpus would diverge). Live shape: first-read deferral.

## Soundness argument (closed reader inventory, general not corpus-gated)

- `AtomicLoader::bag` reads `values` ONLY; `values` is written ONLY in
  `load()` (staged + parse arms); `load()` runs ONLY via
  `ModuleGraph::ensure`, called ONLY from walk/mod.rs (4 sites). Single
  production `impl Loader for`; `AtomicLoader::new` called once.
- `bag()` readers — exactly 3, all in resolver/mod.rs: R1
  `origin_mutation`, R2 `finish_origin`, R3 `bag_value`. No readers in
  module-graph; scope/lookup's `bag()` is the project bag (different
  object); record_copy/shape_of read records, never bags.
- Diet-None ⟺ base-None per key: retained-staged-loaded files collect
  (from identical inputs) on first R-read and memoize before return;
  never-loaded files return None in both arms; streamed/parse/unstaged
  paths are byte-untouched. Zero `Drop` impls → collect/drop timing
  unobservable (sortshape bar by construction).

## The diet (exact transformation, 2 files +97/-18)

- `source.rs`: `StagedBag::{Ready,Lazy}` + `LazyBag{program,path,content}`
  refs; loader gains `pending`; `load()` moves lazies staged→pending
  (no collect); new `bag_mut` collects on first read with the exact
  upfront inputs and memoizes into `values`; dead `bag(&self)` removed;
  +1 pin test (`lazy_bags_collect_on_first_read`: load→pending,
  first-read collects with `declares`, second read replays).
- `mod.rs`: `from_plan` stages retained entries deferred (no collect)
  and streamed entries `Ready`; R1/R2/R3 + `table_value` go `&self`→`&mut`
  onto `loader_mut().bag_mut()` (all callers already `&mut`; the
  let-else early return keeps borrows disjoint).

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm via env

Base `.node` `70a7c830…` / cand `4797532d…` (sha-distinct, verified pre
AND post every run; warnings 18==18). 2 unscored warmups/arm
(w1b 1206.42 cold, w2b 994.38, w1c 1174.03 cold, w2c 983.16). No --seed.

| pair | base syncMs | cand syncMs | Δ (b−c) | order |
| --- | --- | --- | --- | --- |
| 1 | 980.70 | 969.37 | +11.34 | B,C |
| 2 | 972.23 | 971.54 | +0.69 | C,B |
| 3 | 988.90 | 970.98 | +17.92 | B,C |
| 4 | 976.38 | 971.86 | +4.52 | C,B |
| 5 | 980.32 | 985.41 | −5.09 | B,C |
| 6 | 977.49 | 985.17 | −7.68 | C,B |
| 7 | 972.89 | 972.28 | +0.60 | B,C |
| 8 | 983.37 | 971.38 | +11.99 | C,B |

- Base median 978.91; cand median 971.70 → **Δ +7.21 (+0.74%)**, 6/8 favor.
- Ex-run-1: +5.63 — verdict stands. Paired-median: +2.61. Means +4.29.
- Mechanism check (honest): fantasy ≈1.47ms (3003 × ~490ns). Paired-median
  +2.6 sits ≈1.8× fantasy; median +7.2 ≈5×. Both against-pairs (p5/p6) are
  back-to-back slow cand samples (~985) across both orders — machine drift
  or allocator second-order (3003 fewer collect/drop cycles + malloc
  traffic; stageaudit-precedented shape, disclosed not celebrated). No LAND
  claimed: sub-bar both prongs → correct BANK.

## Identity, determinism, suites, quality

4-scale byte-identity, base vs cand, both arms vs sealed pins (full 64-char
+ byte sizes, all runs):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…04819fe` (348,780 B) ✓ pin | `54735e4d…08cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…deb10ec05` (8,289,806 B) ✓ pin | `e1349305…f70103f18cdb` (103,709 B) ✓ pin |

- Determinism: cand enterprise ×2 → identical full-sha (2/2).
- Suites: `cargo test -p atomic` **596 + 1, 0 failed** (595 tip + 1 new pin
  test); `cargo test -p module_graph` **105/105** incl. walk_chains /
  walk_refused / walk_star + atomic resolver staging differential;
  `cargo test -p styletrace` **31/18 with all 18 in hermetic_roots+tracing**
  (0 elsewhere — pre-existing worktree-env failset; styletrace does not
  depend on atomic).
- Vitest `modules/atomic` (569 tests): **failset 35 == 35 base-vs-cand
  byte-identical** (VRT semicolon goldens + tracing env + SITE-54,
  pre-existing). The base arm ran via `REFERENCE_UI_NATIVE_PATH` override
  which artifactually breaks 3 `loader.test.ts` path-resolution tests —
  reproduced with the CAND node under the same override, proving the
  override (not the arm) causes them.
- Quality: `pnpm agentrs q` on both diet files — **0 violations** (2
  warnings pre-existing: mod.rs length was 485 at HEAD, untouched
  `new_with_plan` arity); fmt clean on diet lines; clippy zero mentions
  of diet lines (dead-`bag()` warning designed out by removal).

## Fences honored

- Stageaudit T6: sequenced after, verdict-gated, rebased onto outcome read
  fresh; streamed entries stay `Ready` (their fusion ground untouched).
- Resolve-path mod.rs values region: minimal diff (+97/-18, 2 files).
- Shot2 KILL: demand-deferral with read-census gate, no deadness signals.
- Hashers' landed Fx sets, extract's landed union: untouched.
- Sortshape: zero order changes (membership + memoization only).

## Mechanism proof / artifacts

- Counts: `/tmp/swarm-bagdefer/run{1,2,3}.{json,dump}` + `.norm`
  (order-identical sha `938b8a21bb2e`); aggregator
  `/tmp/swarm-bagdefer-agg.py`; design `/tmp/swarm-bagdefer-design.md`;
  diet draft `/tmp/swarm-bagdefer-diet-draft.md`.
- Verify: `/tmp/swarm-bagdefer-verify.log` (28 runs, node-sha pre/post
  every run); asides `/tmp/swarm-bagdefer-{base,cand}.node`;
  vitest failsets `/tmp/swarm-bagdefer-vitest-{base,cand}.names`.
- Tree: `git status` = `M mod.rs, M source.rs, ?? REPORT.md` only; pin
  `ddce131e7` both ends. Diet left in the tree, no commits, no pushes.
- Bench lock: held twice (count block; verify block), two-step released
  both times. Never stashed (file asides only).
