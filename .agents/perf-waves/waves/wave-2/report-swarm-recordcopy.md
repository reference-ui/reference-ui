# REPORT: swarm-recordcopy — record_copy clone census (recordaudit filler #3)

## Verdict

**CUT (exact copy census × unit microbench: fantasy 0.54 ms < 8 ms bar)**

One line: all four `record_copy` wrappers fire exactly 906 times per
enterprise sync — every one of them `shape_of`, zero `default_of` /
`stars_of` / `names_of` — cloning 3.67-entry records at 596 ns each, for
a 0.54 ms impossible-capture fantasy that misses the 8 ms bar by 15× and
the 5 ms floor by 9×. Nothing was built.

## Base / binaries

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified
  `git rev-parse HEAD` at start and after revert; tree byte-clean since)
- Census `.node`: `7bb6792ee71da4acd89719df524c59a2a082e3d9ee6bc7762d5383af20eac38b`
  (instrumented release build: TEMP-CENSUS counters + dump hook,
  `SWARM_RECORDCOPY_OUT`, loaded via `REFERENCE_UI_NATIVE_PATH`),
  reverted after the count block
- Candidate `.node`: none — CUT before implementation, no diet built
- `git status`: clean except this REPORT.md (untracked); `git diff`: empty
- Bench lock: held once for the count block (install + census build + 3
  count runs + criterion unit), released two-step (`rm -f owner && rmdir`)

## Copy census (exact, 3/3 runs byte-identical)

Enterprise seed-7 load. Counters via in-crate atomics in
`module-graph/src/walk/mod.rs` (4 wrapper counters + cloned-shape sums in
`record_copy`), dumped once at `atomic::compile` end. Verbatim JSON:

```json
{"copy_total":906,"copy_shape":906,"copy_default":0,"copy_stars":0,
 "copy_names":0,"len_entries":3325,"len_declared":3325,"len_imports":906,
 "len_stars":0,"has_default":0,"dumps":1}
```

| counter | count | meaning |
| --- | --- | --- |
| `copy_total` | 906 | `record_copy` clones per sync |
| `copy_shape` | 906 | …via `shape_of` (100% of volume) |
| `copy_default` | 0 | …via `default_of` |
| `copy_stars` | 0 | …via `stars_of` |
| `copy_names` | 0 | …via `names_of` (test-only callers, confirmed live-zero) |
| `len_entries` / `len_declared` | 3325 / 3325 | cloned tables: **3.67** entries/copy |
| `len_imports` | 906 | cloned edges: **1.00**/copy |
| `len_stars` / `has_default` | 0 / 0 | cloned stars/defaults: none |

Copied records run BIGGER than the global histogram (3.67 vs recordaudit's
1.81 mean): copies concentrate on the popular resolution targets, not the
12,000 len-2 dead files. Run syncMs (untimed census, for the record):
1349.0 / 959.7 / 1022.9 — counter JSON identical across all three.

Instrumented-build fidelity: all three runs emitted `cssBytes 2867925 /
dataBytes 214466 / cssCalls 7527` — the sealed pins exactly. Counters
changed no output byte.

Cross-checks (all exact, no re-derivation owed):
- `copy_shape` 906 == recordaudit `get_calls` 906 (`ExportTable::get` has
  exactly one call site: `shape_of`, `walk/mod.rs:256`)
- `copy_names` 0 == recordaudit `names_calls` 0
- `copy_total` == wrappers sum (all wrappers `has_record`-guarded, as coded)
- `dumps` 1 (single compile per sync, recordaudit's standing fact)
- Volume fully explained by extend's census: 4,028 walks − 3,122 bare
  ladder misses = 906 hit-walks → 906 `resolve_export` → 906 `shape_of`;
  zero Hop shapes and zero stars admit no nested `resolve_export`, so no
  further copies are constructible on this load
- `len_stars`/`has_default` 0 consistent with valgraph's fresh `stars0 /
  default0` construction census (independent instrument, same load)

## Unit microbench (criterion, censused shapes e3 + e4)

Temporary `benches/recordcopy.rs` (reverted), release, 100 samples: one
`ModuleRecord::clone` at the bracketed copy shape (n entries + n declared,
11 B keys per recordaudit's 10.85 B mean, 1 import edge, 0 stars/default):

| bench | mean | what |
| --- | --- | --- |
| `record_copy_clone/e3` | **538.14 ns** [531.88–544.40] | clone 3/3/1 record, drop included |
| `record_copy_clone/e4` | **625.09 ns** [616.96–633.34] | clone 4/4/1 record, drop included |

Interpolated unit at the censused 3.67 mean: 538.14 + 0.67 × 86.95 =
**596.4 ns/copy**. Method matches recordaudit (`iter_batched`, setup
excluded, `black_box` on the clone); the setup-built original also drops
per iter — a documented generosity that OVERSTATES the unit, conservative
for this ruling.

## Fantasy math + bar ruling (the losing math)

Generous fantasy = all 906 clones → zero (impossible: any borrowed-view
diet keeps the projected per-call clone — `shape_of`'s
`.get(name).cloned()` ≈ one String alloc of the ~600 ns):

| term | math | ms |
| --- | --- | --- |
| copies | 906 × 596.4 ns | **0.54** |
| upper bound (all e4 CI-top) | 906 × 633.34 ns | 0.57 |

**Ruling: fantasy 0.54 ms < 8 ms bar (15× margin) and < 5 ms floor (9×
margin) → CUT.** No shape clears a bar the ceiling itself misses by an
order of magnitude; per brief, no borrowed-view diet, no 8-pair (a
~0.5 ms-realistic mechanism cannot resolve against ±20–70 ms machine
noise — btreeset/keys/recordaudit precedents). Realistic capture, had it
been built, ≈ 0.5 ms — illustrative only, not claimed.

## Order audit (sortshape bar: passed and filed, moot on CUT)

Exhaustive copy-consumer enumeration (the 4 wrappers are the only
`record_copy` callers; grep-closed over `packages/reference-rs`):

| wrapper | copies | what it reads from the clone | order observed? |
| --- | --- | --- | --- |
| `shape_of` | 906 | point `get` | no |
| `default_of` | 0 | default slot | no (n/a) |
| `stars_of` | 0 | `stars` Vec (source order, not table order) | no |
| `names_of` | 0 | `entries.keys()` — **B-tree table order** | **YES — EXCLUDED** |

Per the brief's sortshape bar, the `names_of` path is EXCLUDED from any
future copy diet, readers named: `exported_names` (`walk/star.rs:42`) and
`collect_star` (`walk/star.rs:137`) — both test-only on this load
(`copy_names` 0). All 906 live copies are order-blind point lookups. (A
borrowed-view diet would preserve order trivially by reading the same
tables, but the exclusion stands as filed.)

## Excluded families / fences honored

- recordaudit's CUT insert ground cited — this mission is the COPY leg,
  disjoint by construction (inserts counted at collect, copies at walk)
- extend's pending ladder/`key.rs` lines: no contact (walk + hook only)
- hashers' landed Fx maps (`records`, walk `cache`, star `seen`): no
  contact — census added atomics only; tables in scope confirmed as the
  BTree ones (`entries: BTreeMap`, `declared: BTreeSet`)
- valgraph's LIVE `ValueGraph::new`: census staged while they held the
  lock; their sites read-only; my dump hook sat at `compile` end, reverted
- btreeset CUT site: method cited only (counts-first, ceiling-barred CUT
  without touching the timed bench)
- shot2 KILL: no avoidance contemplated at any point (per-call WORK only)
- sortshape bar: zero order changes (nothing built; `names_of` excluded)

## Filler (secondary observations for future crews)

1. The would-be diet is 4 borrowed-view one-liners, e.g.
   `self.graph.ensure(file).and_then(|r| r.exports.get(name).cloned())`
   (`ensure` already returns `&ModuleRecord`; the borrow ends before the
   owned return — borrowck-clean), then delete `record_copy`. Zero
   behavior change by construction. Not built: 0.54 ms fantasy.
2. Why the clone exists: original Forge Slice 3 construction (commit
   `32570e250`, "module graph + ValueGraph adoption") — defensive style,
   never revisited, not a deliberate design. Safe to borrow through if a
   future load ever justifies it (it currently does not, 15×).
3. Volume is structurally capped: one copy per hit-walk (906 = every
   relative resolution on the load). Threatening the 5 ms floor needs
   ~10× the cross-file resolution volume AND bigger tables — re-census
   (recipe below), do not assume.
4. Copies concentrate on popular targets (3.67/copy vs 1.81 global mean):
   any future copy diet must census COPIED shapes, not reuse the global
   table histogram.
5. Re-census recipe (no re-derivation): TEMP counters in the 4 walk
   wrappers + `record_copy` lens sums (`exports.names().len()` needs no
   new API), `SWARM_RECORDCOPY_OUT` dump at `compile` end; expected
   output is the JSON in §Census on any seed-7 enterprise run.

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Pin re-verified `ddce131e7…` after
  revert; `git status` clean except this REPORT; `git diff` empty;
  bench-output noise under `benchmark/reports/latest/` reverted.
- (b) Instrumented census build emitted sealed-pin-exact bundle bytes on
  all 3 runs (2867925/214466/7527) — counters were behavior-neutral.
- (c) Census determinism: 3/3 runs byte-identical JSON (`diff` clean ×2);
  criterion unit CIs tight (±1.5%).

## Collision / scope notes (for the captain)

- Untouched per brief + fences: everything in §Excluded families.
- No overlap with live crews' ground on dispatch (valgraph T4 adjacent
  construction ground read-only; their `stars0/default0` independently
  corroborates this census's `len_stars`/`has_default` zero).
- A fast, well-counted CUT per the brief — first-class outcome, no build
  to justify the slot.

## Process note (method)

Counts-first per brief: exact copy census (3 identical runs) ×
criterion unit at the censused shape BEFORE any diet talk — and the bar
ruled before any shape. Grounded in recordaudit (filler #3 + table
census + order-audit ground) + extend (ladder/key fences) + btreeset
(order-audit method) + hashers (Fx fences) + sortshape (order bar) +
parent LOG wave-2 + both backlog blocks. One lock hold, timed work only
(census runs + unit bench); grounding, audit, staging, and the REPORT
skeleton were edit-only while queued. Total timed footprint: one release
build + 3 untimed runs + 1 criterion bench.
