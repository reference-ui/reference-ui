# REPORT: swarm-scoperec — scope/import-record remainder census (repro2 T5)

## Verdict

**CUT (diet-addressable SUM ≈ 0.9–1.5 ms fantasy clears neither the ≥6 ms SUM
bar nor the 5 ms per-phase floor; even vaporizing every string alloc in
`collect_inner` — walks-side and fenced ground included — reaches only
≈1.6–2.6 ms. The room is dry: the flame remainder is BTree/compute, not
strings — borrowed-keys has almost nothing to borrow)**

One line: exact per-import/per-file string census (×3 order-identical runs,
47,343 lines each) proves the three briefed paths hold 43,516 string allocs
total — record_import 21,330 + import_refs-clone 12,441 + clear 9,745 +
attach **0** — and the borrowed-keys shape dies on volume, not soundness
(soundness designed anyway: borrowed-AST unsound, borrowed-content invasive,
specifier unborrowable).

## Base / binaries

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified `git rev-parse
  HEAD` first act and after revert; post cloneplasma-LAND tip).
- Census `.node` sha256: `73a19328f0c931ce3deb3a087b9dadfde43752fc3aabf85c738df71c2fd36837`
  (counts only, never timed; release build, 18 pre-existing warnings, zero new —
  grep-verified none from the 7 touched files).
- Census instrumentation: env-gated (`SWARM_SCOPEREC_COUNT`) `eprintln!` lines
  (7 files, +107/−4, zero behavior change when unset) — **fully reverted**
  (`git checkout`; tree == HEAD, verified below).
- Raw dumps: `/tmp/swarm-scoperec-count{1,2,3}.err` (+`.json` run envelopes);
  aggregator `/tmp/swarm-scoperec-agg.py`; census binary saved aside at
  `/tmp/swarm-scoperec-census.node`. Bench-report byproducts reverted.
- Bench lock: one held block (install + census build + 3 count runs), two-step
  release; no foreign PIDs touched.

## Census method (counts-first, per-import/per-file)

One `SCOPE` line per event on stderr; serial compile attributes events between
`begin` lines to that file/path with zero signature changes:

- `begin tag=extract|probe|with|standalone` at the 4 live `scope::collect` /
  `collect_with` call sites (2 test-only sites excluded by inspection).
- `import kind=named|default|namespace local/imported/spec` lens per recorded
  specifier + `import_skip` per skipped declaration.
- `declare len` per `ScopeTable::declare` (import-path declares derived 1:1
  from specifiers; the rest is walks-side context).
- `importrefs n bytes` per `import_refs()` call (the 3×Box\<str\> clone leg).
- `clear factory/token/deps/passes/cleared/wait_bytes/dep_bytes` per file +
  `cleared kind=factory|token|cascade` lens per clone.
- `attach_push len` per pending helper + `attach n ok` per file.

Determinism: 47,343 lines ×3 runs; normalized sha (harness
`neo-bench-XXXXXX` tmpdir stripped) **order-sensitive identical ×3**
(`bfabce87a…`; sorted-multiset `ea313fcb…` ×3). Count-run bundle bytes
pin-exact (css 2,867,925 / data 214,466) → output-clean.

## Exact census (enterprise, seed 7)

| collect path | collects | imports | declares |
| --- | --- | --- | --- |
| extract (`lib.rs` per-file) | 3,122 | 4,028 | 18,901 |
| probe (`collect_origin`, import-free kept) | 119 | 119 | 555 |
| with (`collect_with`, origins with imports) | 119 | 119 | 555 |
| standalone (`extract::extract`) | 0 | 0 | 0 |
| TOTAL | 3,360 | 4,266 | 20,011 |

- Import kinds: **4,266 named, 0 default, 0 namespace, 0 skips** (type/nospec).
  Per-import means: local 4.27 B, imported 4.27 B, specifier 19.01 B.
- `import_refs()` calls: 3,241 (= 3,122 extract + 119 probe; with-path never
  calls) → 4,147 refs, 113,840 clone bytes.
- Clear: 9,745 factory waits (**100% cleared** — no keyframes/positionTry
  imports on this load), 0 token waits, **0 deps, 0 cascade passes**;
  cleared clones 9,745 × ~6.0 B avg = 58,724 B.
- Attach: **0 pushes / 0 attached on all 3,360 files** — zero string traffic.
- Context (walks-side/fenced, NOT in SUM): non-import declares 15,745 keys /
  100,514 B; FactoryWait construction 19,490 allocs / 96,219 B.

## The losing math (fantasy at validated rates)

Rate: 20–33 ns per malloc-pair (33 ns = cloneplasma's Euclid rate validated on
this box); memcpy ≈ 20 GB/s.

| path (brief's diet class) | string allocs | bytes |
| --- | --- | --- |
| record_import: imported_name transient + local/imported/spec boxes + declare key (5 × 4,266) | 21,330 | 153,939 |
| import_refs clone leg (3 × 4,147) | 12,441 | 113,840 |
| clear: cleared clones (9,745) | 9,745 | 58,724 |
| attach: pending pushes | 0 | 0 |
| **SUM** | **43,516** | **326,503** |

**SUM ≈ 43,516 × 20–33 ns (0.87–1.44 ms) + 0.31 MB memcpy (≈0.02) ≈
0.9–1.5 ms fantasy** — clears neither the ≥6 ms SUM bar nor the 5 ms
per-phase floor, by 4–5×.

Maximal bound (EVERY string alloc in `collect_inner`, walks-side + fenced
included): +15,745 declare keys + 19,490 wait strings = 78,751 allocs /
523,236 B ≈ **1.6–2.6 ms**. Even the ceiling that no sound diet could reach
fails both bars. CUT is structural, not marginal.

Flame reconciliation: repro2's record_import ≈ 4wt self vs my import-path
strings ≈ 0.7–1.1 ms fantasy — the other ~3wt is BTreeMap insert/rebalance +
node allocs + dispatch (non-string, outside borrowed-keys). Attach 1–3wt is
pure second-walk + ScopeChain/lowering compute with ZERO string traffic.
Clear 1–2wt ≈ my 0.2–0.3 ms clones + `resolve_from` BTree gets (no allocs).

## Borrowed-keys soundness (designed, not assumed)

Dies on volume — but the design was done, for the record:

- Borrow-from-AST (`&'a str` on oxc Allocator): **UNSOUND** for
  resolver-kept tables. `refine_streamed` builds the table from a
  function-local `Allocator`, stores the owned `ScopeTable` in
  `ValueGraph.refined`, allocator drops — borrowed keys would dangle. Would
  need one live allocator per refined file.
- Borrow-from-content (`&'s str` on session sources): lifetime OK ('s
  outlives the compile) but invasive ('s threaded through
  ScopeTable→Binding→ImportRef→Dep→RefinedFile→constructors/tests) AND the
  specifier can't borrow (quoted Atom, unescaped — not a content substring;
  `StringLiteral` imported names likewise). Mixed owned/borrowed repr for
  ≤1.5 ms fantasy.
- Distinction vs extract-crew rejection (cited, not relitigated): they
  rejected walk-FUSION, a scheduling shape (clear/strip need the complete
  table; attach/call_init need the stripped table — report-swarm-extract
  §census). Borrowed-keys is a repr shape on a different axis; it fails the
  census gate before scheduling matters.

## Fences honored (all hard)

- Walk-fusion: untouched (no scheduling change staged or proposed).
- Analysis-side shadows (analysisb LIVE): untouched — no analysis file read
  past grounding, none modified.
- Hashers' landed Fx sets (`stripped`, shadow slices): composed underneath,
  zero contact; `strip_stale` uninstrumented.
- Shot2 KILL: no skip/avoidance logic staged ("don't record waits" pre-scan
  shapes deliberately not built — per-record WORK only).
- Cloneplasma E1 when_strings: adjacent, no contact. Sortshape: zero order
  changes (census lines only, fully reverted).
- Callers outside brief (`fold_call_inits`, `resolve_origin_ref`
  `local.to_string()`, resolver maps): observed, unfenced-by-me, untouched.

## Filler (honest: the room is dry)

- Per-declaration specifier dedup (the largest single string mass, 81,119 B):
  ceiling = all 4,266 spec boxes ≈ **0.14 ms fantasy** — sub-noise, no shape.
- FactoryWait construction (19,490 allocs — 100% cleared on this load):
  any "don't record" fix is skip/avoidance logic — barred by shot2-KILL
  reasoning (no pre-scan signal); per-record work is already minimal.
- Observed, not pursued (fusion fence): probe+with double-collects 119
  origins (238 of 3,360 collects, 7%) — a scheduling shape, explicitly not
  this brief.
- Recommendation: close T5 as DRY. Revisit only if a future census shows an
  import-dense load (current: 1.27 imports/collect).

## Tree state

- `git status` clean (census patch + bench-report byproducts all reverted);
  `git rev-parse HEAD` = `ddce131e7` (pin).
- Tree = REPORT.md only. No commits, no pushes. No suites run (nothing to
  verify — tree == tested base HEAD).
- No `pnpm agentrs q` run (no diet files; nothing added).
