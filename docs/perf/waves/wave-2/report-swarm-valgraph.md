# swarm-valgraph REPORT: ValueGraph construction audit (repro2 T4)

## Verdict

**CUT** — bundle fantasy ≈ 3.5ms (generous ceilings, measured units)
vs the 8ms bundle bar: 2.3× margin. Bars the 5ms per-phase floor too.
No shapes built. Tree = REPORT only.

## Topic

`ValueGraph::new` per-compile setup under `atomic::compile` (repro2 T4):
record drops, map builds, `AtomicFs` setup. Flame: `new` 22/23wt
(drops 4–6 + from_iter 4–5 + `AtomicFs::new` 4 + maps).
RECON-WITH-BAR, bundle-track: exact piece census first; shapes only if
the bundle SUMS ≥ 8ms fantasy.

Base pin: `ddce131e7` (`git rev-parse HEAD` verified at start and end;
no commits, no pushes).

## Piece census (exact, enterprise seed-7, `SWARM_VALGRAPH_OUT` JSON)

3/3 byte-identical runs (instrumented `.node`
`9c20cc28…`, rebuilt once for class-split counters, then 2/2 identical
on all 40 counters; old-format run excluded from the diff by construction).
Single compile (`new_calls` 1).

| counter | count | meaning |
| --- | --- | --- |
| `sources` / `fs_inserts` / `fs_dupes` | 15122 / 15122 / 0 | Fs index: every source inserts, zero dupes |
| `path_len_sum` | 1303532 (mean 86.2B) | path bytes hashed + cloned into the index |
| `retained` / `streamed` | 3122 / 12000 | pairs vs streamed inputs |
| `census_pairs` | 15122 | = 3122 + 12000 ✓ |
| `census_with_specs` / `specs_total` | 3122 / 4028 | exactly the retained files carry specs |
| `match_calls` / `bare_early` | 4028 / 3122 | 906 relative specs probed |
| `match_probes` / `match_hits` | 1812 / 906 | base + ext-union probes, all hit |
| `keynew_census` | 1812 | = probes (one `ModuleKey::new` per probe) |
| `census_outgoing` / `census_imported` | 3122 / 119 | plan sets |
| `ospec_heap` | 3122 | heap Vecs (= with_specs; 12000 empty Vecs unallocated) |
| `staged_ret` / `unstaged_ret` | 3122 / 0 | **every retained record stages** |
| `staged_stream` / `unstaged_stream` | 0 / 12000 | **every streamed record+bag drops in `from_plan`** |
| `programs_len` / `staged_len` / `streamed_keys_len` | 3122 / 3122 / 12000 | map sizes (programs read-only) |
| retained means (imports/declared/exports) | 1.29 / 1.10 / 1.10 | tiny records |
| streamed means (imports/declared/exports) | 0.00 / 2.00 / 2.00 | tiny const-pair records |
| `stars` / `default` | 0 / 0 | both classes |

Cross-checks (all exact): `r_* + s_*` == census-loop totals (5/5);
`census_pairs` 15122 == recordaudit's 15122 collects; `specs` 4028,
relative 906, `imported` 119 == extend's walk/ladder/origins counts;
`staged` 3122 == extend's `rfi_calls`.

Drop inventory (by construction, verified by code read): every
collected record drops exactly once — 12000 streamed in `from_plan`,
3122 staged at `ValueGraph` drop (end of `run_parse_phase`; `graph`
is a local; loader→graph moves preserve single ownership). Total
record drops: **15122**. Bag drops ride along: 12000 streamed (early)
+ 3122 retained (late) = 15122. Zero `impl Drop` in `module_graph` +
`atomic/src/extract` → drops are pure deallocation; drop ORDER is
unobservable (sortshape bar satisfied by construction).

## Unit microprobes (temp criterion bench, reverted after)

Pure-drop protocol: `iter_with_setup` (clone builds the heap shape in
untimed setup, timed routine frees it). A forget-delta design was
BUILT, MEASURED, and KILLED first (forget arm 2.3× SLOWER than
drop — unbounded leak measures allocator distress, not clone cost).

Shapes: s1 = (1 import, 1 export, 2 plain), s2 = (3,4,8), s3 =
(8,10,20). Census means are SUB-s1 in both classes → s1 is a
per-record CEILING (streamed ≈ 0.9× s1, retained ≈ 0.7× by heap-object
count — the fantasy uses 1.0× anyway).

| probe | unit (criterion medians) |
| --- | --- |
| `record_drop` s1/s2/s3 | 156 / 386 / 852 ns |
| `bag_drop` s1/empty | 139 / 40 ns (floor) |
| `bag_collect` s1/s2 | 394 ns / 1.69 µs (filler anchor) |
| `key_new` 40/64/96B | 128 / 140 / 154 ns (≈150ns at the 86B mean) |
| `fs_index` 15k default→presized | 980 → 731 µs (**growth Δ 249 µs**) |
| set 12k default→presized | 636 → 538 µs (**growth Δ 98 µs**) |
| set 4k default | 232 µs (58 ns/insert) |

## Bundle fantasy math + bar ruling

Generous ceilings (100% capture, s1 units for sub-s1 records):

| piece | count × unit | fantasy |
| --- | --- | --- |
| record drops (arena 100%) | 15122 × 155ns | 2.34 ms |
| Fs index presize (measured Δ) | 249 µs | 0.25 ms |
| `streamed_keys` presize (measured Δ) | 98 µs | 0.10 ms |
| `staged` + census-sets presize (scaled) | ~6.4k ins | 0.06 ms |
| `outgoing_specifiers` Vec elimination | 3122 heap × ~60ns | 0.19 ms |
| `stages()` set-fusion (one probe not two) | 12000 × ~20ns | 0.24 ms |
| census key-clone borrowing | 12000 × ~15ns | 0.18 ms |
| match-path ex-`ModuleKey::new` (extend's) | 906 × ~130ns | 0.12 ms |
| **SUM** | | **≈ 3.5 ms** |

**Ruling: 3.5 < 8 → CUT**, 2.3× margin; also under the 5ms
per-phase floor. No shapes built. Deliberately excluded from the sum:
bag drops (no size census — envelope 0.6 floor / 2.1 s1-scale ms, NOT
legit fantasy: a record-arena doesn't capture them without a second
invasive co-design); `ModuleKey::new` units (extend BANKED);
`ModuleRecord::collect` internals (recordaudit CUT at 6.4ms fantasy);
`programs` presize (~0.03ms, programsfx LIVE); bag collection
(semantic work — filler A below, outside the brief's bundle).

Flame reconciliation (honest residual): bottom-up ≈ 12–13wt of the
22wt envelope (Fs-total ≈ 3.5 incl. keynews, drops 2.3, retained
collect ≈ 2, bag collects ≈ 1.1, maps ≈ 1.4, census ≈ 1, key/clone
misc ≈ 1). Residual ≈ 9–10wt = richer real files than minimal
fixtures (collect/const-walk units 2–3× — recordaudit/T5 ground, not
brief surface) + bag drops (unmeasured sizes, excluded) + sampling
attribution. Even DOUBLING the drop piece (4.7ms — incredible vs the
sub-s1 census means) the bundle reaches only ≈ 5.9ms. The CUT does
not depend on the residual.

## Per-piece filler (filed, not built)

- **F1. Retained-bag deferral** (≈1.3ms fantasy, needs a home outside
  T4): 3122 bags collected in `from_plan` (`bag_collect` ≈ 350ns at
  retained means) but reads ≈ 119 `collect_origin` clones (extend's
  exact count) + uncounted `mutation` probes (`mod.rs:344`). Shape:
  collect the bag inside `collect_origin` from the retained program
  instead of up front; unread bags skip collect AND drop. Fences:
  touches the resolve path (`mod.rs` values region — outside this
  brief); sequence AFTER stageaudit T6 (shared `loader.values`
  shape); needs a 2-counter read census + soundness proof that no
  other reader reaches `loader.bag` first.
- **F2. Streamed-bag non-collection** (stageaudit T6's, cross-ref
  only): 12000 bags collected in `StreamedSource::collect`, ALL
  dropped unread in `from_plan` (staged_stream 0). Their
  double-collect fusion may already cover it. No contact made.
- **F3. `stages()` set-fusion** (0.24ms, bankable micro-shape):
  census emits the staged UNION directly instead of
  outgoing+imported with an OR-query; halves `stages()` probes
  (27122 → 15122). Zero order effects (membership-only sets).
  A future micro-crew may bank it; too small to carry a slot.
- **F4. Borrowed census keys + chained `outgoing_specifiers`**
  (0.37ms combined): borrow `(&ModuleKey, &ModuleRecord)` in the
  census chain (keep the 3122 outgoing clones); return a chained
  iterator instead of a collected Vec. Zero-alloc census reads.
- **F5. Map presize quartet** (0.41ms measured+scaled): `Fs` index
  `with_capacity(sources.len())`, `streamed_keys`/`staged`/
  census sets likewise. Composes UNDERNEATH the landed Fx types
  and extend's banked key shape; `programs` EXCLUDED (programsfx).
- **F6. Arena revival condition** (killed, do not retry without):
  record-arena needs per-record drops ≥ ~450ns at 15122 counts to
  matter — census proves sub-s1 records at 140–155ns. Revives only
  if a future corpus carries ≥3× richer records (re-census first).

## Fences honored

- extend BANKED (`key.rs` + `ladder/mod.rs`): no contact; keynew
  units measured for context only, excluded from the sum.
- programsfx LIVE: their patch read — `HashMap<usize,&Program>`→Fx
  in identity/hosts/lib/styletrace. DISJOINT (different maps,
  files, time). `programs.insert` line untouched (`len()` read-only).
- hashers LANDED Fx: presize shapes (F5) compose underneath, never
  convert.
- shot2 KILL: no skip/avoidance/pre-open logic anywhere; filler F1
  is demand-deferral of unread work with a read-census gate, not a
  deadness signal.
- extract LANDED JsxHosts: untouched. sortshape: zero order changes
  (nothing built; F3/F4 are membership-only by construction).
- recordaudit CUT: collect internals untouched, cited as ground.
- stageaudit (T6) LIVE: `StreamedSource::collect` untouched; F2
  filed as cross-ref, F1 fenced to sequence after them.

## Mechanism proof / artifacts

- Counts: `/tmp/swarm-valgraph/count1.json` == `count2.json`
  (40 counters, new-format binary); first binary 3/3 identical on
  30 counters. Instrumented `.node` sha
  `9c20cc28…` (first build; rebuild for split counters).
- Units: temp criterion bench `swarm_valgraph` (reverted with all
  scaffolding); forget-delta kill documented above.
- Tree: `git status` = `?? REPORT.md` only; pin `ddce131e7` both ends.
- Bench lock: held once for install + census builds + 5 count runs
  + unit bench; two-step released.
