# Fasthull recon 1 — Wave 1 map (recon-1b, second rotation)

All 7 brief suspects confirmed LIVE with fresh firsthand evidence. No product
edits were made. First rotation (recon-1) died to a provider net-timeout; its
one-liners were treated as leads only — every count below was reproduced by
this crew (lead bench + kept-repo counts + 3 nested workers' /tmp probes).

- Lead bench (this tree, box quiet): medium 451ms / 205.2 MiB, enterprise
  3.42s / 808.3 MiB vs pin 5eda2c60b7e5 3.51s / 796.0; bundle byte-identical
  to pin (styles.css 14.3 MiB / 825.0 KiB gzip, runtime-data.mjs 3.9 MiB /
  211.3 KiB gzip).
- Panda goalpost (same seed-7 load): enterprise 645ms / 261 MiB /
  2.7 MiB css / 71 KiB JS runtime. Per panda notes.md, Panda's JS is a
  runtime, not namer tables — A7 is framed as internal duplication only.
- Conventions: paths are repo-relative in this tree unless noted. "Worker A"
  = bridge/sheets, "worker B" = parse/scan, "worker C" = bundle levers.

## A1 — Slim the N-API CompileResult (S1) — LIVE

(a) Work skipped by a tight engine: production `sync()` consumes 6 fields
(`stylesheet`, `portableStylesheet`, `runtime`, `diagnostics`,
`tracedJsxHosts`, `compilerDiagnostics`), but the bridge serde's,
N-API-copies, and V8-parses all 11 — including `wants` (per-want
file/line/col), `style_plans`, per-atom `css.classes`, top-level `recipes`
(byte-identical to the map already inside `runtime.recipes`), and
`atom_count`.
(b) Lever: sync wall (serde serialize + N-API string copy + V8 parse of the
dead half) + peak RSS (parsed dead objects retained to GC) + internal
payload bytes (~48% of the N-API string at scale).
(c) Evidence (worker A probes `/tmp/recon-a-probe*.mjs`, `compileSync` via
prebuilt `dist/atomic.mjs`; lead verified struct + seam firsthand):
- Struct `packages/reference-rs/modules/atomic/src/types.rs:59-84` — 11
  `pub` fields (lead-counted), all serialized except None-skipped
  `css`/`compilerDiagnostics`.
- Bridge `native.rs:115-119` (`serde_json::to_string` of whole struct) →
  `modules/runtime/js/native.ts:27` (`JSON.parse`). One big string.
- Production seam `packages/reference-neo/src/sync/native.ts:44-62`
  declares only the 6 live fields (lead-read); dead 5 undeclared.
  Single caller `sync/index.ts:108`; zero neo-src references to dead fields.
- Recipes x2: `recipes/mod.rs:18` aliases `RecipeTable = RecipeRuntimeTable`;
  `assembly.rs:71` clones each table into `runtime.recipes` AND
  `assembly.rs:96-99` collects the same tables top-level. Probe:
  1825 == 1825 bytes, deepEqual=true.
- `css.classes` is exactly atomCount entries (6/6, 299/299, 121/121 across
  probe scales), built by `build_css_runtime` (`assembly.rs:183-199`),
  consumed nowhere in neo src or tests.
- Byte counts (MEDIUM-200, 406,380 B total): `wants` 129,854 (32.0%) +
  `stylePlans` 49,079 (12.1%) + `css` 11,525 (2.8%) + `recipes` 5,596
  (1.4%) + `atomCount` 3 B → dead ~196 KB, 48.3%. At SMALL dead is ~2.2% —
  dead share grows with scale. Live `runtime` field (90,893 B: namer +
  stylePropNames + recipes map) is fully consumed — not dead.
- Test-only consumers exist (re-pointable, not production): `stylePlans` →
  RS `tests/helpers.ts:167`, harvest-census, NEO-NAMER-01 differential gate;
  `wants` → helpers.ts:259-286, harvest-census, NEO-SITE-14 hostless;
  `recipes` → ATM-RECIPE-02 spec; `css` → helpers.ts + css.json goldens.
  Nuance: `stylePlans` is read internally by proof render
  (`assembly.rs:103-108`) — build may stay, serialization can go.
(d) Disjointness: `atomic/src/{types.rs,native.rs,assembly.rs (~96-122)}`,
`atomic/js/types.ts`, `contracts/{types.ts,fixtures/compile-result.json}`,
RS tests, `NEO-NAMER-01/differential.spec.ts`, `NEO-SITE-14/hostless.spec.ts`.
Shares `assembly.rs` with A2 (adjacent hunks ~81-95 vs ~96-122) and the
contracts fixture/types with A2 + A7 — see lane plan.
(e) Out of bounds: no. Harvest still runs (only surfacing dropped); no spec
loading touched; published sheets/data unchanged.

## A2 — Print the utility sheet once (S2) — LIVE

(a) Work skipped: `build_stylesheet_with` and
`build_portable_stylesheet_with` both sort + print the full utilities layer
(plus recipes/reset/global/fonts/keyframes) on the same atom set. The two
outputs differ in at most 2 token-selector lines.
(b) Lever: sync wall (O(atoms log atoms) re-sort + full second emit) +
internal payload bytes (second sheet ~15-21% of N-API string: 31KB/152KB
small, 60KB/406KB medium).
(c) Evidence (worker A probe at 3 scales; lead `cmp` on kept medium repo):
- Builders `stylesheet/emitter/mod.rs:33-58` identical except
  `append_system_layers` vs `append_portable_system_layers`; invoked
  back-to-back in `assembly.rs:81-95`. Only divergence is
  `append_tokens(..., portable: bool)` (`system_layers/mod.rs:220-244`).
- Measured positional diff: exactly 2 lines (light selector ~line 139,
  dark ~line 478); all other lines byte-identical (769/1079/622-line
  sheets). Lead: kept-medium `styled/styles.css` vs `react/styles.css`
  `cmp`-clean BYTE-IDENTICAL (2,554,607 B each) — consistent (bench load
  has no dark-token divergence; worst case is the 2 selector lines).
- Sorted + printed twice: `write_utilities` sorts per call
  (`cascade/mod.rs:111-120` `ranked.sort_by`) once per sheet; recipe groups
  also re-sorted per sheet (`emitter/mod.rs:120` inside
  `group_recipe_atoms`).
- Skip is mechanical + contract-safe: single `portable: bool` param (the
  wrappers already take it) or primary + 2-line splice at the
  `write_token_block` selector sites. Do NOT blind string-replace (globalCss
  could theoretically contain selector text). Pins: RS seam tests
  (ATM-SEAM-01, seam.test.ts, token10, cascade-order, spec-recipes),
  `contracts/fixtures/compile-result.json` + contracts.test.ts, emitter
  unit tests — all verify byte-exactness.
(d) Disjointness: `stylesheet/{emitter/mod.rs,system_layers/mod.rs}`,
`assembly.rs` (~81-95), emitter tests + golden `output/styles.css` files,
contracts fixture. Shares `assembly.rs` + fixture with A1; shares
`emitter/mod.rs` (different functions) with A6 — see lane plan.
(e) Out of bounds: no. Both published sheets stay byte-identical; pure
compute/payload removal.

## A3 — Drop per-file retention after use (S3) — LIVE

(a) Work skipped: all 15k sources, Oxc allocators, ASTs (+ error vecs), and
merged/per-file constant bags are held to end of `compile()` — including
12k dead files whose AST is never needed after constants are copied out.
Plus a transient full second `Vec<(String,String)>` of all texts.
(b) Lever: peak RSS (15k arenas + ASTs + 2x source text + 2x constants
simultaneously) + sync wall via allocator churn.
(c) Evidence (worker B borrow-chain analysis; lead verified `lib.rs`):
- `lib.rs:65` `sources`, `:68-69` `allocators` ("live for the whole",
  lead-read comment), `parsed`, `:79-81` `project_constants`/`graph`/
  `identity`, `:84-85` `diag_session`/`resolved_hosts`, `:90` `analysis`
  borrowing `sources`+`parsed` (`:89-96`) and used at the last step
  (`:141` `partition_channels`) — the borrow anchor that pins everything.
- `project_constants` absorbs 12k dead `FACTOR_n` entries (`merge` at
  `lib.rs:236`); resolver stages per-file `(ModuleRecord, LocalConstants)`
  (`extract/resolver/mod.rs:98-109`) — constants stored twice.
- Transient 2x texts: `hosts/entries.rs:13` re-runs full `sources::collect`
  (all texts re-read + re-allocated); `AtomicFs::read_to_string` clones
  staged text per ladder probe (`extract/resolver/source.rs:59-63`).
(d) Disjointness: `atomic/src/{lib.rs (lifetime/block scope),sources.rs}`,
`extract/{resolver/mod.rs,identity.rs}`, `diagnostics/{session.rs,
analysis/mod.rs}`, `harvest/literals.rs` (pool span). Overlaps A4/A5 in
`lib.rs`/`sources.rs` — same lane (dead-file fast path).
(e) Out of bounds: no. Lifetime/release engineering; extraction results
unchanged.

## A4 — Pre-parse byte gate for the dead majority (S4) — LIVE

(a) Work skipped: every dead file (12k of 15k at enterprise, `plans.ts:66-74`;
dead shape = `FACTOR_n` const + pure fn, `templates/dead.ts:5-13`) pays a
full Oxc parse + 7 full `visit_program` walks with zero pre-filter: W1+W2
constants collect twice (`lib.rs:229-236`, `resolver/mod.rs:106` →
`collect.rs:48`), W3 scope (`lib.rs:251`), W4 extract (`lib.rs:279` →
`extract/mod.rs:473`), W5 harvest pool (`lib.rs:120` →
`harvest/literals.rs:67-76,83`), W6+W7 diagnostics css/jsx
(`analysis/mod.rs:111-112`) — plus styletrace's second Oxc parse per entry
(`styletrace/src/analysis/parser/mod.rs:55`). No `contains`/gate exists
outside a test assert.
(b) Lever: sync wall (12k files x (parse + 7 walks) pure overhead). Side
benefit: keeps 12k `FACTOR_n` entries out of `project_constants`, speeding
name-wide lookups.
(c) Evidence (worker B walk-site grep + `/tmp/recon-b-gate-probe.mjs`):
gate `includes('import') && (css|recipe|from)` passes 0/12000 dead files
and passes live files (live always `import { css }`,
`templates/component.ts:45`). Dead files dodge only the demand-driven
passes (`collect_origin`, identity re-parse) — the 7 eager walks + parse
are unconditional. Tasty is NOT a dependency of atomic — no sync-path role.
(d) Disjointness: `atomic/src/lib.rs` (gate point),
`extract/{constants/collect.rs,scope/collect/mod.rs,mod.rs,bindings.rs,
resolver/mod.rs}`, `harvest/literals.rs` (walk site only),
`diagnostics/analysis/{mod,css,jsx}.rs`. Same lane as A3/A5.
(e) Out of bounds: no — with a fence. Walk-cost scrape only; harvest pool
collection keeps running for live files. No doctrine change, no pool
rewrite, no kill. Next crew's architect must hold this line.

## A5 — Filter before read; collect once (S5) — LIVE

(a) Work skipped: read-then-filter at every stage, plus an identical full
re-collect: TS `scanner.ts:63` fg scan → `:79` `readFileSync` EVERY file →
`:83` import-regex filter after read (lead-verified order); RS-A
`sources.rs` `scan_dir` + `read_to_string` every supported file, THEN
`scope.matches_file` filter (`:34-36`, lead-verified order); RS-B
`hosts/entries.rs:13` re-runs the entire `sources::collect` (re-read +
re-scan) to map paths; RS-C styletrace `parser/mod.rs:60` re-reads +
re-parses per entry. Minor: ladder tsconfig/package.json probes per edge,
cached edge re-reads, declaration reads.
(b) Lever: sync wall (4x read amplification: 4 full content reads x 15k
files = 60k reads per sync — 1 TS + 3 RS; 3 dir scans) + transient RSS
(pass B duplicates all texts).
(c) Evidence (worker B call-trace; lead verified both read-then-filter
orders firsthand): TS chain `scanner.ts` <- `fragments/base/index.ts:80-92`
<- `prepareFragments` <- `sync/index.ts:86`; RS-A called `lib.rs:65`; RS-B
via `hosts/mod.rs:74` <- `lib.rs:85`. `compile-files.ts:21`
(`collectCompileFiles`) has zero callers — dead code, excluded from counts.
(d) Disjointness: `reference-neo/src/{fragments/lib/scanner.ts,
fragments/base/index.ts,sync/index.ts}` (TS scan — the ONLY neo-side piece
of lane b) + `atomic/src/{sources.rs,hosts/entries.rs,hosts/mod.rs}` +
`styletrace/.../parser/mod.rs` + `module-graph/{ladder/mod.rs,fs.rs}`.
Same lane as A3/A4 (shared `lib.rs`/`sources.rs`); TS scanner files are
disjoint from all RS lanes.
(e) Out of bounds: no. Same files selected, same bytes parsed — fewer reads.

## A6 — Recipe sheet: responsive fan-out + identical-block grouping (S6) — LIVE

(a) Work skipped: every recipe unconditionally emits base + full variant
matrix + compounds + FULL responsive matrix (every value x 5 width
breakpoints), with no call-site use signal; identical resolved blocks print
once per class instead of grouped.
(b) Lever: styles.css bytes (primary: ~74% of the ~88% recipes layer = ~65%
of the whole sheet is the responsive fan-out) + sync wall (5x re-resolve of
identical wants; unmeasured).
(c) Evidence (worker C `/tmp/recon-c-*.mjs` probes, pin-matching bytes;
lead layer counts on kept medium repo):
- Small css 550,910 B (= pin): recipes 480,251 B (87.2%, 2,484 blocks),
  utilities 66,122 B (12.0%). Medium 2,554,607 B (= pin): recipes
  2,302,549 B (90.1%, 11,317 blocks — lead: 28,586 rules incl. wraps).
  0 recipe-pattern selectors in `@layer utilities` — isolation holds.
- `@container` blocks = 357,229/480,251 B (74.4%) of recipes layer (small);
  responsive entries/values = exactly 5.0x (990/198 small, 3960/792
  medium). Rule fan-out multiplies further: 2,958 `@container` occurrences
  from 990 entries (condition-leaf fan-out, `emitter/mod.rs:82-93`).
- Emission: `recipes/mod.rs:74-101` (`compile_one`, always full),
  `:103-120` variants (no use signal), `:128-144` responsive (identical
  wants re-resolved 5x; only widthless names skipped, `table.rs:74-81`),
  `:158-174` compounds (no dedup — identical predicates emit identical
  rules twice; piggyback A9). Class names are pure deterministic fns of
  (stem, axis, value) (`recipes/name.rs:9-61`) — identity never needs a big
  sheet.
- Hypothesis (NOT shared atomics — ATM-RECIPE-01 mandates closed classes
  in `@layer recipes`, never utilities): (a) gate each (value, breakpoint)
  rule on observed call-site responsive objects — needs a NEW extraction
  signal (extraction covers definition leaves only, ATM-SITE-03; selection
  resolves at browser runtime, `runtime/recipe/recipe.ts:144-158); (b)
  group byte-identical resolved declarations under one comma selector
  within the same breakpoint wrap, keeping every class name, every
  `@container`, and source order. Paint holds: (b) changes nothing
  observable; (a) emits a superset of observed selections. Stations
  ATM-RECIPE-01/03/05/07 hold: layer, order (compounds-after-variants,
  plain-before-query per NEO-RECIPE-08), `@container`-not-`@media` (D8).
  Only exact-string goldens churn under (b).
(d) Disjointness: `atomic/src/recipes/{mod.rs,name.rs}`,
`stylesheet/emitter/mod.rs` (grouping fns only — shared FILE with lane a's
A2 `write_utilities` work; different functions, sequence with care),
`extract/*` (move (a) signal only — shared with lane b, see lane plan),
`tests/cases/recipe/*` + `reference-neo/tests/cases/recipe/*` (re-proof).
Does NOT touch: runtime-data shape, namer, utility pipeline.
(e) Out of bounds: no. Recipes still extracted, still closed classes, still
painted; bench load untouched; explicitly preserves the closed-class model
— the opposite of Panda's atomic-pool collapse.

## A7 — Derive runtime-data recipe tables at runtime (S7) — LIVE

(a) Work skipped: `combinations` (full Cartesian join map) and
`responsiveVariantMap` (5x per-bp expansion) are 100% mechanical
re-derivations of shipped `base` + `variantMap` + compounds — precomputed
strings, shipped per recipe.
(b) Lever: runtime-data.mjs bytes (combinations + responsive = 88.4% small /
88.6% medium of the recipes table; ~79% of runtime-data.mjs at medium, ~98%
at enterprise per dead-lead shape, confirmed consistent) + peak RSS
(materialization; unmeasured).
(c) Evidence (worker C probes + `/tmp/recon-c-demo.mjs`; lead table
breakdown on kept medium repo):
- Small data 255,767 B (= pin): recipes 170,961 (66.9%);
  combinations 104,912 (61.4%), responsive 46,198 (27.0%), variantMap 8,650
  (5.1%); namer fixed 59,286, stylePropNames fixed 25,327. Medium 808,657 B
  (= pin): recipes 723,850 (89.5%, lead: 88 entries); combinations 61.8%,
  responsive 26.8%, variantMap 5.0%. 22 recipes -> 594 combos (27.0/recipe)
  -> 2376 at medium; responsive 990 = 198 values x 5 bps.
- Derivation proof (code): publisher `recipes/table.rs:24-43` (`build`);
  combinations = Cartesian product (`:120-143`, `:184-208`), values = base
  + variant + compound classes (`:156-171`); responsive = pure namer fn
  per axis x bp x value (`:49-68`, `name.rs:33-35`), never reading
  variantMap's class strings. Contract `runtime/plan.rs:47-60`, shipped by
  `sync/publish/styled.ts:60-72` (`JSON.stringify(runtime)`).
- Derivation proof (bytes): full-blob recompute from base+variantMap+
  compounds matches shipped tables 594/594 + 990/990 (small), 2376/2376 +
  3960/3960 (medium). Sample: `combinations["accent|sm|info|tight"]` = base
  + 4 variantMap lookups joined with spaces, verbatim;
  `responsiveVariantMap.tone.sm.accent` = `"sm:" + variantMap.tone.accent`.
- Consumers that constrain the skip: `runtime/recipe/recipe.ts:160-173`
  (`lookupCombination`), `:144-158` (`resolveResponsiveClasses`), `:183-199`
  (`composeClasses` — a fallback composer ALREADY exists, used `:251` on
  miss); registration `sync/react.ts:32-35`; types
  `sync/publish/system.ts:94-103`, `contracts/types.ts:61-76`; FIVE paint
  specs pin table shape (NEO-RECIPE-02/03/08/09/11 assert
  `recipe(selection) === table.combinations[key]`). A skip must keep keys
  readable (lazy getters/proxies over shipped variantMap, or ship only
  observed-selection combos) or renegotiate those 5 specs as a contract
  change. Runtime cost of composing per call: one string join over <=4
  axes — already paid on every miss path.
(d) Disjointness: `atomic/src/recipes/table.rs` + `runtime/plan.rs`,
`reference-neo/src/runtime/recipe/recipe.ts`,
`reference-neo/src/sync/{react.ts,publish/*}`,
`reference-neo/tests/cases/recipe/NEO-RECIPE-{02,03,08,09,11}` + engine
`tests/cases/recipe/*` stations. Shares `recipes/` DIR with A6 but disjoint
FILES (`table.rs` vs `mod.rs`); shares `contracts/types.ts` sections +
  fixture with lane a — see lane plan. Does NOT touch: CSS emission,
  extraction, namer.
(e) Out of bounds: no. variantMap/compounds still compiled, resolution
results identical; no load change; strictly internal dedup — no Panda
comparison (Panda JS is a runtime per their notes).

## Piggybacks (not lanes)

- A8 (lane b): per-file host-set clones — `ExtractVisitor::new` clones
  `bindings` + `jsx_hosts` + `owned_props` per file (`extract/mod.rs:306-322`;
  set rebuilt per file `lib.rs:260-261`); per-node `recipe_binding` clone
  (`extract/mod.rs:399`); path-string clones x4+. Borrow instead of clone.
- A9 (lane c): duplicate compound records + rules — identical predicates
  emit identical rules twice (`mod.rs:158-174`); same-class dedup is pure
  win, load-independent, station-safe. Small yield in this load.
- A10 (future, untested lead): `runtime` field carries ~85 KB fixed bridge
  tax (`namer` ~60 KB + `stylePropNames` ~25 KB, fully consumed) per
  compile — cacheable only if sync ever splits spec-changed from
  sources-changed. No probe; morning question at best.

## Killed

None of the 7. Minor kills inside the work: Tasty has no sync-path role
(not a dependency of atomic — excluded from A4 scope);
`sync/compile-files.ts` (`collectCompileFiles`) has zero callers (dead
code, no perf); worker-A's "2 differing lines" refined by lead `cmp`
(bench sheets byte-identical; 2 lines is the worst case with dark tokens).

## Lane plan for Wave 1 (captain decides; recommendation: 4 crews)

- perf-1-a "cold payload" (A1+A2): one hypothesis — bytes nobody consumes
  are never built, shipped, or printed twice. Single crew because A1+A2
  share `assembly.rs` (adjacent hunks) + contracts fixture/types.
- perf-1-b "dead-file fast path" (A3+A4+A5): one hypothesis — files that
  cannot contain styling cost no read, parse, walk, or retain. Single crew:
  shared `lib.rs`/`sources.rs`; TS scanner files are disjoint from all RS
  work but same hypothesis. Architect holds the A4 fence: walk scrape, not
  harvest doctrine.
- perf-1-c "recipe sheet" (A6 move (b) grouping NOW; move (a) observed-use
  gating rides Wave 2 — it needs an `extract/*` signal owned by lane b this
  wave). Shares `emitter/mod.rs` FILE with lane a (different functions —
  `group_recipe_atoms`/`emit_recipe_rule` vs `write_utilities`; sequence or
  split by function with care).
- perf-1-d "recipe tables" (A7): derive-or-lazy combinations/responsive.
  Shares `recipes/` dir with lane c (disjoint files: `table.rs` vs `mod.rs`)
  and contracts types/fixture sections with lane a (different sections;
  independent-files-first merge, fixture last).

Shared-file summary: `assembly.rs` (a-internal), `emitter/mod.rs` (a/c,
different fns), contracts fixture+types (a/d, different sections),
`recipes/` dir (c/d, disjoint files), neo recipe specs (c/d, different
files). No other cross-lane files. Churn guardrail applies to b (namer/
harvest/atoms-adjacent) and c/d (recipe emission shape); a may skip churn
only if the architect writes why (payload-only removal).
