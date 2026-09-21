# Fasthull 3a architect — lane A (C3) homework rulings

LEAD-AUTHORED (disclosed): three nested architect rotations died on runtime
stream failures with zero output (03:46–04:10Z). The lane lead performed the
architect function inline from firsthand reads (all file:line below verified
in this tree). The independent reviewer MUST re-derive (i)–(iv) firsthand and
treat this memo as untrusted input. Implementer is a separate agent.

Verdict: **NARROW** — steps 1+2 full shape; step 3 narrowed to
stream-with-complete-staging (no census, no TS flags). The full walk-skip
(record/bag/merge skip + per-repo census) is KILLED for W3 (proof cost
exceeds prize; revisit W4 with C2's ladder memo in place).

Revised lever (profiler bases): step 1 (320−F1) + step 2 (271−A−~50 union
insurance) + step 3 (~10ms CPU + ~100MB true-peak RSS, scored carry
uncertain). Sync ≈ 400–500ms with sane floors — clears 350–450.

## Step 1: CONCUR — fg.async + bounded-concurrency reads, order-preserving

- `fg.async` exists (fast-glob 3.3.3; default export is async, `.sync` /
  `.async` attached — `out/index.d.ts:12-23`). `fg.sync` and `fg.async`
  share the walker: same traversal, same order for the same options.
- Order restoration: index-tagged reads (`files.map((f, i) => read(i))`),
  `Promise.all`, place by index, then match in fg order. Eval
  concatenates bundles in scan order (`fragments/base/index.ts:199-201`)
  and `mergeRecordFragments` is later-wins (`:316-323`): index-restore
  preserves both exactly. Null-skip on read error preserved
  (`scanner.ts:93-97` shape: catch → null → continue).
- Bounded pool: hand-rolled (~15 lines, never `Promise.all` on 15k
  promises at once — libuv churn + 15k-promise spike). p-limit is NOT a
  neo dep; `package.json` is out of boundary — no new dependency.
- Callers: `scanFragmentFiles` (`base/index.ts:80-92`, via async
  `prepareFragments`) + runner planner (`runner.ts:103-109`, async fn).
  Both can await. Core owns a SEPARATE scanner copy
  (`reference-core/.../lib/fragments/scanner`) — untouchable, unaffected.
  Existing tests mock `scanForFragments` with sync array returns
  (`base/index.test.ts:17`); `await` on an array is identity, so mocks
  stay green if the signature goes async. Implementer MAY change the
  signature to async OR add an async variant; reviewer re-greps callers.
- Hazard: none. Scan is pure discovery (no eval, no writes). Concurrency
  affects only read completion order, which index-restore erases.
- Mandate: implementer measures the parallel floor F1 on the bench repo
  in-lane and reports it (profiler: 21µs/file serial model, floor
  unmeasured).

## (i) Scan-set equality: TS-mirror + MANDATED native union-fill

Neither scan subsumes the other. Native (`sources.rs:57-99`): recursive
`read_dir`, IGNORE dirs (`node_modules .git dist build .turbo target
.reference-ui .reference .pipeline`), `is_supported_extension`
(ts/tsx/js/jsx — **`foo.d.ts` INCLUDED**, ext is `ts`), then
`IncludeScope` predicate, silent read-error drop (`:94`). TS
(`scanner.ts:69-104`): `fg.sync(include, {cwd, absolute, ignore:
node_modules + *.d.ts})`, dotfiles excluded (fg `dot:false` default),
reads all, import-filters for matches.

Asymmetries and rulings (each verified firsthand):

| # | asymmetry | ruling |
| --- | --- | --- |
| a | extensions: fg returns whatever `include` matches (`.css`/`.json` under `**/*`); `filter_virtual_sources` (`sources.rs:42-52`) applies NO extension check | TS filters retention to ts/tsx/js/jsx (mirror `is_supported_extension`). Native untouched (legacy virtual-`files` callers keep exact semantics). |
| b | IGNORE dirs: native drops 9 dirs; fg ignore lacks 8 | TS drops paths with any relative dir segment in the IGNORE list (mirror `handle_dir_entry`). |
| c | dotfiles: fg excludes, native includes | Retention scan uses `dot:true`; MATCHES emulate `dot:false` (drop paths with any dot-segment, computed on the cwd-relative form — the cwd prefix itself is never dot-tested). |
| d | `*.d.ts`: fg ignores, native includes | Retention ignore = `node_modules` only; MATCHES keep the `*.d.ts` exclusion. |
| e | empty set | TS omits `files` (None) when retention is empty → native disk-scan fallback (`sources.rs:23-27`). Defense in depth. |
| f | path strings | Both sides derive from the same unmodified root string (TS `cwd`, native `root_dir`; sync passes `cwd` for both): no canonicalization either side, so absolute forms are string-identical incl. symlinked prefixes. |
| g | read errors / races | Both skip silently. Sharing NARROWS the prepare→collect race (strictly more consistent). |
| h | glob engines | Hand-rolled `includes/glob.rs` (no extglobs; `*`/`?`/classes in-segment, `**` across) vs micromatch. NO differential coverage exists in tree (verified). Native-stricter divergence is CONSISTENT (scope drops in both worlds — scope applies to provided files too). Native-LOOSER divergence (e.g. mid-segment `**`, `glob.rs` `AnyAcross` "wherever it appears") would silently drop files. |

Because (h) is unprovable without a full differential proof and the
failure mode is silent, **union-fill in `sources.rs` is MANDATED**
(recon's blessed alternative): when `files` is provided, native builds
the provided map (scope-filtered), walks the disk for candidate PATHS
(scope+ext+IGNORE, no reads), and reads only scope-hit paths missing
from the map. Set-equality then holds BY CONSTRUCTION for every
pattern. Cost: ~44–60ms of `stat`/readdir retained (profiler: scan_dir
stat 35t) — affordable inside the lever. On realistic repos union-fill
finds nothing (TS mirror covers it); it is pure insurance.

Mandated tests: (1) vitest differential — TS retention scan of a tricky
fixture (dotfile, `.d.ts`, `dist/`-nested, `node_modules/`, `.json`
under `**/*` include, negation-only include, empty-match include) →
`compile({files})` vs `compile({rootDir})` byte-identical
(wants/sheets/diagnostics); both shapes callable today via
`AnyCompileRequest`. (2) Rust `gather()` unit test: provided-vs-scan
equivalence on a temp dir. (3) Existing ATM-SCAN-01/02 + SITE-57 stay
green (union-fill must not alter disk-scan behavior when `files` is
absent — code path shared, read-skipped only for provided hits).

## (ii) Parse-error preservation: streaming-parse-keeps-errors SOUND

- `report_parse_errors` (`lib.rs:322-344`) iterates sources×parsed in
  order, pushing per-error diagnostics. Transient per-file parse in
  source order with immediate error report produces the IDENTICAL
  sequence (same inputs, same order, same `line_col`).
- SITE-57 (`modules/atomic/tests/cases/ATM-SITE-57`): `Broken.tsx`
  (`export function Broken( {`, styling-skip-clean, unparsable) yields
  BOTH `ATM-E-PARSE` (main phase) and `ATM-W-TRACE-SKIPPED` (trace).
  Main-phase error preserved by (ii); trace warning preserved because
  the `sources` vec is IDENTICAL (trace re-parses staged bytes —
  `hosts/mod.rs:89-97` — untouched by retention changes).
- `partition_channels` / `SourceCatalog` (`diagnostics/site.rs:52-72`):
  "one (path, content) pair per SourceId index" — TEXTS only, no program
  dependence. lib.rs builds the catalog from flags+texts (`:125-134`);
  implementer keeps that derivation with a full-length panicked-flags
  vec (transient parses record their flags).
- Merge order: `LocalConstants::merge` (`extract/constants/index.rs:243-
  257`) is order-sensitive (scalars APPEND leaves in merge order,
  objects/arrays/mutated FIRST-wins). Transient constants MUST merge in
  source order at the correct positions: single in-order merge loop
  (retained → retained parse; streamed → transient parse/collect now).
- Panicked branches mirrored per file: panicked → errors kept,
  constants/record/bag skipped (`lib.rs:351-359`, `resolver/mod.rs:100-
  102`), flags set. Transient path checks `ret.panicked` identically.

## (iii) Sterile gate: NARROW to stream-with-complete-staging — NO census

Full walk-skip (skip record/bag/merge for proven-sterile) needs TWO
per-repo proofs, both heavier than the 75–100ms prize:

1. No-READ proof: dropping a record/bag changes walk outcomes for any
   file whose resolution path touches it. Worse, MISS ≠ ABSENT as data:
   `follow_specifier` on an unstaged target yields `Refused::Unresolved`
   while a staged exportless record yields `Refused::MissingExport`
   (`module-graph/src/walk/mod.rs:144-164`) — different refusal data,
   so the census must cover every PATH touch, not just terminals, and
   needs ladder probes (C2's territory, ~109ms unmemoized).
2. Unbound-name proof: the project bag answers unbound names
   (`scope/lookup.rs:42-52`, wired `lib.rs:376-379`). Skipping a merge
   needs candidate-names ∩ retained-unbound-refs = ∅; computing either
   side costs back the savings (candidate names need the collect being
   skipped; retained refs need an identifier walk + shadow reasoning).

Both killed for W3. Revisit W4 with C2's probe memo in place.

**Ruled shape: stream-with-complete-staging.** For byte-verified
streamable files, native parses transiently and stages EVERYTHING the
retained path stages — constants (merged in order), ModuleRecord, bag,
AND an eagerly-built RefinedFile — then drops only the program +
allocator. Nothing downstream can observe the drop:

- Eager refinement is exact IFF the file's `import_refs()` is empty:
  `collect_origin` with empty refs skips `resolve_origin_imports`
  (the only graph use) and calls `finish_origin(probe)` (`resolver/
  mod.rs:243-263`) — identical inputs to today's on-demand path give
  the identical table/markers/bag. `refined_file` checks the refined
  map FIRST (`:222`), so `programs` (consulted ONLY there — verified,
  `:228-229` is the sole reader) is never missed. Ready-path values
  (`table_value`, incl. pure-fn descriptors the bag lacks) identical.
- `refs` emptiness ⟸ no-`import`-bytes: `import_refs` (`scope/
  table.rs:234-242`) collects `BindingKind::Import`, created ONLY from
  static `ImportDeclaration` with value specifiers (`scope/collect/
  imports.rs:15-29`; bare/type-only/dynamic/`require()` create none).
  The `import` keyword is mandatory for that node ⟹ absence proves
  emptiness. Conservative direction (comments/strings containing
  "import" retain) is sound. ModuleRecord edges likewise static-only
  (`module-graph/record/collect.rs:54-62`); export-FROM hops live in
  the STAGED record and route identically — no gate needed.
- Extract: streamable ⟹ `styling_skip` ⟹ `extract_all_sources` skips
  (`lib.rs:274-275`) — program unread. Analysis: streamable ⟹
  styling-skip ⟹ `analyze` content-gates before touching program
  (`analysis/mod.rs:109-118`, "only the per-file walks skip, never
  the vec") and predicts zero facts. Harvest: streamable ⟹ quote-free
  (`string_skip`) ⟹ pool walk visits zero literals (existing identity
  comment, `harvest/literals.rs:64-67`).
- `sources` vec IDENTICAL ⟹ `hosts::resolve`, `IdentityGraph::new`
  (keep all paths — cheap, zero risk), `AtomicFs::new`, partition
  catalog all identical. Lane B's `lib.rs:169` call-site hunk untouched.

**Stream gate (native, per file, all hold; TS sends NO flags — native
re-gates from shared bytes, 15k × ~3 memchrs ≈ 1–2ms):**
`styling_skip(content)` AND `string_skip(content)`.

Slot mechanics (all in-boundary — `analysis/` UNTOUCHED):
- `AnalysisInput`/`AnalyzedSource` fields are all pub
  (`analysis/mod.rs:31-34, 78-82`); lib.rs builds the analyzed vec
  directly instead of `for_compile` (which STAYS for `tests/gates.rs`):
  retained → real program; streamed → ONE shared dummy program (single
  empty-source parse on a phase-lived allocator). Dummy is provably
  unread (streamed ⟹ styling-skip ⟹ `analyze` continues before use).
  SourceId slots stable; catalog consistent (same flags+order).
- `collect_pool` takes filtered `parsed` + identically-filtered `skip`
  mask; merge is order-free set union (`literals.rs:47-51`).
- `ValueGraph::new` restructured (in-boundary `resolver/mod.rs`): stage
  retained (record+bag+program) + streamed (record+bag+refined from
  transient, no program). `debug_assert_eq!(sources.len(), parsed.len())`
  goes with the signature.

Stations that pin this: ATM-SCAN-01/02 (scope), SITE-57 (Broken error +
trace warning through a streamed file), `tests/gates.rs` (W1 skip
gates), `resolver/tests.rs` + scope tests (fallback), contracts 13/13,
`identity_tests.rs` barrel chains, tsconfig-paths arms, full agentneo
173. Mandated NEW tests: (1) streamed-but-imported value still resolves
  (live file imports a byte-streamable util's scalar — Ready path
  through eager refinement); (2) streamed barrel hop routes (live →
  byte-streamable `export…from` barrel → live target); (3) unbound ref
  to a streamed file's const resolves (merge kept); (4) parse error in
  a streamed file reported with exact location (Broken-shape).

Expected step-3 yield: ~10ms CPU + ~100MB true-peak RSS (arenas/ASTs
never co-resident). The profiler's 75–100ms walk figure is FOREGONE by
this narrowing (record/bag/merge walks kept) — stated plainly so the
reviewer scores the real shape. Scored-RSS carry: UNCERTAIN (S1's
territory) — measure, never promise.

## (iv) Logical request-json + contracts: RULED

- `sync/index.ts:126-130`: serialize WITH files suppressed —
  `JSON.stringify({ ...request, files: undefined }, null, 2)`
  (`undefined` drops from JSON; no unused-var lint). Published
  `compile-request.json` stays LOGICAL; a `files`-carrying artifact
  regrows megabytes and fails review. Reviewer MUST check artifact
  bytes.
- N-API bridge already accepts `files` (`native.rs:28-29`
  `#[serde(default)] files`, threaded into `CompileRequest` at `:64`) —
  NO bridge change.
- `contracts/types.ts` `NativeCompileRequest`: add additive-optional
  `files?: VirtualSource[]` + `VirtualSource` interface, with doc
  comment (frozen-contract additive precedent: `include` RS-10, `logs`
  S5). `modules/atomic/js/types.ts` already declares both (`CompileRequest.files`,
  `VirtualSource`) — implementer verifies whether its
  `NativeCompileRequest` re-declares the frozen shape and mirrors there
  if so; old fixtures stay valid (additive).
- `PreparedFragments` (`base/index.ts:52-55`, in-boundary) gains the
  retained scan for sync's request assembly (e.g. `scannedSources`):
  15k `{path, content}` ≈ 4.2MB held TS-side until `compileNative`
  resolves, then dropped (no lingering refs — reviewer checks).
  `createPortableFragmentBundle` unchanged (bundles only).

## Implementer mandates

1. Sequence 1→2→3 with a bench checkpoint each (medium `--runs 1` to
   iterate; enterprise for the claim). Report F1 (step-1 floor) and A
   (`request.files` JSON authoring: N-API string + serde + the
   `filter_virtual_sources` clones at `sources.rs:50`) as MEASURED
   numbers. If A > 60ms, flag to lead (no fallback needed — 271−60
   still wins big).
2. Never touch `lib.rs:169` (lane B's call-site hunk), `hosts/*`,
   `entries.rs`, styletrace, `analysis/*`, `compile-files.ts` (dead,
   out of boundary), `package.json` (no new deps), `core/*`.
3. `compile-request.json` logical (above). CSS bytes IDENTICAL or the
   arc dies on sight (sheet DONE at 2.7MiB).
4. Churn RUNS (parse/staging-adjacent). Stability: agentrs touched
   crates + agentneo cases, all in this tree, RS via agentrs only.
5. New tests: (i)-differential + (iii)-1..4 above, committed in-tree.

Architect: NARROW — steps 1+2 full, step 3 as stream-with-complete-staging (no census, no TS flags); walk-skip killed for W3, ~400-500ms sync + ~100MB true-RSS expected.
