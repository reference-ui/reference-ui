# REPORT: swarm-recordaudit — record-collect BTree audit (repro2 T3)

## Verdict

**CUT (exact insert census × unit microbench: fantasy 6.4 ms < 8 ms bar)**

One line: 15,122 enterprise records carry 54,880 B-tree inserts into tiny
per-file tables (final size ≤ 4, mean 1.81, 10.85 B keys), all `insert_local`,
zero live `names()` calls — and the criterion unit (466 ns per 2+2 build)
prices the entire insert path, String allocs included, at 6.4 ms even at
impossible 100% capture. The bar clears nothing; no shape was built.

## Base / binaries

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified
  `git rev-parse HEAD` at start and after revert; tree byte-clean since)
- Census `.node`: instrumented release build (TEMP-CENSUS counters + dump
  hook, env-gated `SWARM_RECORDAUDIT_OUT`), reverted after the count block
- Candidate `.node`: none — CUT before implementation, no diet built
- `git status`: clean except this REPORT.md (untracked); `git diff`: empty
- Bench lock: held once for the count block (install + census build + 3
  count runs + criterion unit), released two-step (`rm -f owner && rmdir`)

## Insert census (exact, 3/3 runs byte-identical)

Enterprise seed-7 load (3,000 style + 12,000 dead files, 7,527 css calls,
120 recipes). Counters via env-gated atomics in
`module-graph/src/record/{mod,collect}.rs`, dumped once at `atomic::compile`
end (`dumps: 1`, single compile per sync confirmed).

| counter | count | meaning |
| --- | --- | --- |
| `collect_calls` | 15,122 | `ModuleRecord::collect` per sync (every file exactly once) |
| `declared_inserts` | 27,440 | `BTreeSet::insert` into `declared` (1.81/record) |
| `declared_bytes` | 297,676 | key bytes → mean key **10.85 B** |
| `entries_local` | 27,440 | `insert_local` (key + `Local` value double-clone) |
| `entries_exported` | **0** | `insert_exported`: `export {…}` forms absent on this load |
| `entries_key_bytes` | 297,676 | same names as declared |
| `get_calls` | 906 | `ExportTable::get` (== extend's 906 relative-hit `value_of`) |
| `declares_calls` | 906 | `declares` → `contains` |
| `hop_calls` | 15,122 | `hop_specifiers` (staging census reads every record) |
| `hop_yielded` | **0** | Hop path stone cold: zero `export … from` on this load |
| `names_calls` | **0** | `names()` never called on the live path (test-only chain) |

Final table sizes per record (both tables, identical histograms):

| len | 0 | 1 | 2 | 3–4 | 5–8 | 9–16 | 17+ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| records | 2 | 3,000 | 12,000 | 120 | 0 | 0 | 0 |

Total B-tree inserts per sync: **54,880**, every one into a tree that never
exceeds 4 entries. Run syncMs (untimed census, for the record): 1396.2 /
979.6 / 988.9 — counter JSON identical across all three.

Instrumented-build fidelity: run-1 bundle bytes `cssBytes 2867925 /
dataBytes 214466` match the sealed pins exactly; cssCalls 7527 on all runs.
Counters changed no output byte.

## Unit microbench (criterion, censused shape 2/2/11)

Temporary `benches/recordaudit.rs` (reverted), release, 100 samples:

| bench | mean | what |
| --- | --- | --- |
| `record_tables_build` | **465.97 ns** [456–474] | 2 set + 2 map inserts, 11 B keys, 6 String allocs, drop included |
| `record_tables_lookup` | **20.82 ns** | 1 `contains` + 1 `get` on prebuilt tables |

Per-insert unit at censused shape: 466 / 4 = **116.5 ns**, String allocs and
node frees inside the measurement (`iter_batched`, setup excluded,
`black_box` on the built tables).

## Fantasy math + bar ruling (the losing math)

Generous fantasy = entire measured insert-path cost → zero (impossible: any
`HashMap` diet keeps the key String allocs, the dominant share):

| term | math | ms |
| --- | --- | --- |
| inserts | 54,880 × 116.5 ns | **6.39** |
| point reads | 1,812 × ~10.4 ns | 0.02 |
| hop walks (unmeasured, generous) | 15,122 × ~7 ns | ~0.10 |
| **fantasy total** | | **≈ 6.5 < 8** |

**Ruling: fantasy 6.5 ms < 8 ms bar → CUT.** No shape clears a bar the
ceiling itself misses; per brief, no Hash+sort-once, no key-shape diet, no
8-pair (a ~2 ms-realistic mechanism cannot resolve against ±20–70 ms machine
noise — btreeset/keys precedents). Realistic capture, had it been built,
would be ~30–50% of the non-alloc insert portion ≈ 1–2 ms — illustrative
only, not claimed.

Flame cross-check: repro2 sized this topic "true ≈ 6–8" with a 3a-high
oversample warning and told the crew to size by census, not delta. The exact
6.4 ms insert fantasy lands at the bottom of that band — the upper flame
readings (`BTreeMap::insert` 19/12wt, `insert_local` 10/6, `var_names` 10/7)
were the documented 3a extract-oversample plus family-sharing (see below).

## Order audit (btreeset-method gate: passed but moot)

Exhaustive reader enumeration of both in-scope tables. The gate PASSED —
order is unobserved on the live path — but the ceiling barred any conversion,
so this stands as ground for future crews, not a build license.

`ExportTable.entries: BTreeMap<String, ExportShape>`:

| reader | use | order observed? |
| --- | --- | --- |
| `get` (`walk/mod.rs:256`, 906 calls) | point lookup | no |
| `hop_specifiers` → `staging.rs:125` → `StagingPlan::census` into `FxHashSet`s | membership | no |
| `names()` → `names_of` → `exported_names` | sorted Vec, re-sorted into `BTreeSet` | no live caller (`names_calls: 0`; only `walk_star.rs` tests) |

`ModuleRecord.declared: BTreeSet<String>`: sole reader is `declares()` →
`contains` (906 calls); zero `.declared` field iterations anywhere including
tests. Membership-only.

Sortshape bar honored: zero order changes made (nothing built). Had the bar
cleared, the conversion-safe set was exactly `{entries, declared}` with
sort-at-enumeration preserved in the test-only `exported_names`.

## Excluded families (not this site, with evidence)

- **`compare_components` inside `BTreeMap::insert`**: belongs to
  `styletrace/.../analyzer.rs:24` (`modules: BTreeMap<PathBuf, …>`) —
  PathBuf-keyed compares, the flame's "trace 4" caller. Not record-collect.
- **Serializer family** ("serializer 4" caller): `serde_json::Map`
  (`BTreeMap`) rebuilds — third-party type, hashers explicitly excluded.
- **`star.rs` `StarCollect.names: BTreeSet`**: fed only via the test-only
  `exported_names` — zero live inserts.
- **Atomic runtime tables** (`tables/mod.rs`, `lowerings`): per-compile
  one-shot builds from small const data, outside the brief's file fence.
- **Fences honored, no contact**: extend's ladder/`key.rs` lines, hashers'
  landed Fx record maps, modgraph strip-906, manifest 0/0, btreeset CUT site
  (method cited only), shot2 KILL (no avoidance logic contemplated).

## Filler (secondary observations for future crews)

1. `insert_local` double-clones every name (key + `Local` value): 27,440 × 2
   String allocs. The value string IS read (`walk/mod.rs:174` →
   `local_step`), so dedup needs a type/shape change — key-shape diet
   fantasy ≈ one alloc × 27,440 ≈ 0.8 ms, subsumed in the CUT.
2. `entries_exported == 0` and `hop_yielded == 0`: the entire
   `export {…}` / `export … from` Hop machinery is dead weight on the
   seed-7 load. Any future Hop-path diet must re-census on a load that
   exercises it.
3. `shape_of`/`default_of`/`stars_of`/`names_of` each `record_copy` — a full
   `ModuleRecord` clone (both B-trees + import edges) per lookup. Clone cost
   scales with table size; out of this brief's scope (neither insert nor
   key-shape), noted, not pursued.
4. `hop_specifiers` allocates nothing when yielding zero (collect over an
   empty filter), so its 15,122 calls cost a ≤4-element walk each — the
   ~0.1 ms generosity above is genuinely generous.

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Pin re-verified `ddce131e7…` after revert;
  `git status` clean except this REPORT; bench-output noise under
  `benchmark/reports/latest/` reverted.
- (b) Instrumented census build emitted sealed-pin-exact bundle bytes
  (2867925/214466) — counters were behavior-neutral.
- (c) Census determinism: 3/3 runs byte-identical JSON (`diff` clean ×2).

## Collision / scope notes (for the captain)

- Untouched per brief + fences: everything listed in §Excluded families.
- No overlap with live crews' ground (lineindex T1 site.rs, pushstring T2
  literal path, valgraph T4 `ValueGraph::new`, scoperec T5 scope collect,
  stageaudit T6 staging, wantctx S1) — record tables are disjoint.
- Re-census recipe (no re-derivation): the TEMP-CENSUS patch shape is 11
  counters + 2 histograms + `SWARM_RECORDAUDIT_OUT` dump at `compile` end;
  expected output is the table in §Census on any seed-7 enterprise run.

## Process note (method)

Counts-first per brief: exact insert census (3 identical runs) ×
criterion-style unit microbench BEFORE any diet talk — and the bar ruled
before any shape. Grounded in repro2 T3 + flame + btreeset (order-audit
method) + hashers (Fx'd record HASH ground) + extend (ladder/key fences)
reports. One lock hold, timed work only (census runs + unit bench); audit
and staging were edit-only while queued.
