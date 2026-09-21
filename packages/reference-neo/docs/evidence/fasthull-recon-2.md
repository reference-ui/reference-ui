# Fasthull recon 2 — Wave 2 map (fresh oracle crew)

Read-only map. No product edits were made (deps install + native build only,
to run the burndown). Three nested readers (A css, B sync wall, C RSS/data)
worked static-only; every headline below was spot-verified firsthand by the
lead (file:line cites are lead-read unless marked worker). One correction to
a worker phrasing is flagged inline (§B1 evidence).

- Lead burndown (this tree, `deepsee all --scale enterprise`, seed 7):
  sync 2.64s, RSS worker 687.1 / parent 686.5 MiB. Box held install/build
  churn earlier, so treat the captain's quiet medians (2.46s / 670.9 MiB)
  as the levels and this run's shares, RSS, and bytes as the signal.
  Bundle reconciled to the byte (residuals 0/0): css 15,007,762 =
  pin-identical (825.0 KiB gzip), data 530,606 = W1 close (42.6 KiB gzip).
- Panda goalpost (unchanged): 645ms / 261 MiB / 2.7 MiB css.
  Remaining gap: 3.8x sync, 2.6x RSS, 5.3x css.
- Headline: the css gap is fully explained by unobserved emission
  (10.95 MiB responsive + ~0.9 MiB dead-plain) and closes in-bounds —
  no architectural-copy morning question is needed. The sync remainder
  is assembly (612ms), publish double-materialization, and the
  slim-payload codec (~390ms, sheets 98.4%); the RSS remainder is
  proof-row materialization (~30-40 MiB) over a 511 MiB arena-physics
  floor; the data remainder is variantMap class strings (201 KiB).

## Post-W1 burndown (seed 7, firsthand)

Exact stage walls: `config` 18.3ms (0.7%), `fragments.prepare` 345ms
(13.1%), `fragments.evaluate` 6.2ms (0.2%), `native.compile` 2.03s
(76.8%), `publish` 242ms (9.2%).

Sampled native internals (scaled): `assembly` 612ms (23.2% — fattest
native phase), `serde` 293 (11.1%), `emit` 242 (9.2%), `napi-bridge`
161 (6.1%), `parse` 131 (5.0%), `hosts` 125 (4.7%), `extract` 104
(4.0%), `diagnostics` 103 (3.9%), `constants` 76 (2.9%), `scan/read`
73 (2.8%), `ts` 707 (26.8%). Cross-check Δ ±96ms (was ±192 — the
V8-side `JSON.parse` of the now-30 MiB bridge string).

RSS: payload 29.82 MiB (was 53.29 — A1 verified); residual 511 MiB
(86% of growth), 34.6 KiB/file (was 38.2 — A3 phase-drop moved it).

CSS: recipes 12.12 MiB (84.7%: `@container` 10.95 MiB / 52,555
blocks, class rules 1.17 MiB / 8,864), utilities 2.18 MiB (class
1.31 MiB / 13,771, `@container` 892 KiB / 3 — definition-side
responsive in `css()` calls, stays under any recipe gating).

Data: recipes table 435.4 KiB (variantMap 201.3 / 46.2% — now the
fattest field, compoundVariants 95.1, defaultVariants 30.5,
responsiveBreakpoints 21.9, qualifiedName 20.5, base 19.2,
variantKeys 17.6, className 11.0), namer 57.9, stylePropNames 24.8.

## What is spent

A1 (slim bridge: 53.29 → 29.82 MiB payload, codec Δ ±192 → ±96ms),
A2 (single sheet print), A3 (phase-drop: 38.2 → 34.6 KiB/file), A4
(byte gates), A5 (scope-before-read, single collect, staged
styletrace content, scanner pre-gate), A7 (tables derived at
runtime: 3.9 MiB → 518 KiB), A8 (visitor borrows), A9 (0 exact-dup
compounds at both scales — re-census agreed, nothing left). A6b
grouping KILLED (0 order-safe sites, gzip-positive). A10 (fixed
namer tax) stays a morning question — see §Morning questions.
Do not re-propose any of these without new evidence.

## B1 — Observed-use gating of recipe emission (A6a + dead-recipe shake, fused)

(a) Work skipped by a tight engine: 19,800 `(value, breakpoint)`
responsive rules (~10.95 MiB, 90% of the recipes layer) for
selections never observed at any call site, plus the full plain
matrices of the 320 uncalled part-recipes (~0.9 MiB). The load's
only call-site template passes plain literals
(`{ tone: 'muted', size: 'md' }`); observed responsive selections
= 0; only group roots are ever imported.

(b) Lever: styles.css 14.31 → ~3.4 MiB (responsive gate alone),
→ ~2.5-2.7 MiB with the shake (≈ Panda 2.7). Side effects,
unmeasured but positive: the 5x responsive re-resolve inside
`assembly` (612ms phase), smaller dual sheets through serde /
napi-bridge / publish.

(c) Evidence (lead-verified): gate point `recipes/mod.rs:134-143`
still loops all 5 container breakpoints × all values
unconditionally; bps `table.rs:77-84`. No call-site selection
signal exists: `extract/recipes/mod.rs:19-63` handles `recipe(...)`
definitions only (gated on the `recipe` import binding); result
calls (`dialog0({...})`) are never visited. (Worker phrasing
correction: `extract/` does contain 108 `responsive|breakpoint`
hits — all `BreakpointScale` plumbing + one comment, zero
selection signal.) Sole call site
`benchmark/generate/templates/component.ts:55` (lead-grepped:
only `componentModule` takes a hookup; churn is
definitions-only); hookup imports group roots only at
`HOOK_PROB = 0.3` (`generators/app.ts:42,77-84`); groups fan out
to 440 tables (`templates/recipe.ts:91-99`: root + 2-3 parts).
Static-exact count: 3,960 values × 5 bps = 19,800 responsive
rules → 52,555 measured `@container` occurrences (×2.65
condition-leaf fan-out at print, `emitter/mod.rs:82-93`).
`@container` 10.95 MiB is the measured ceiling (this burndown).
Roots: 3,000 files × 0.3 / 120 groups ≈ 7.5 calls/group ⇒ all
120 roots called w.h.p.; 320 parts never imported.

(d) Disjointness: lane owns `extract/recipes/selection.rs` (NEW:
result-binding map + `X(selection)` visitor),
`extract/mod.rs:386-390` hook region, `extract/bindings.rs`
(result-binding tracking), `lib.rs` (new sink + thread),
`assembly.rs:147-177` (join by className), `recipes/mod.rs`
(gate), `tests/cases/ATM-RECIPE-*/output/styles.css` rebless.
The two moves (gate + shake) are NOT disjoint — same signal,
adjacent gate hunks — so they ride one lane, gate first.
Shares `assembly.rs`/`lib.rs` files with B3 (different hunks —
captain sequences); shares `recipes/` dir with B5 (disjoint
files: `mod.rs` vs `table.rs`, W1 c/d precedent). Touches no
bridge/types, no TS publish, no utility pipeline.

(e) Out-of-bounds check: clean with one architect ruling.
Closed classes stay (ATM-RECIPE-01), `@container`-not-`@media`
(D8), order stations hold (a subset preserves order), no
delete-recipes/namer/dual-sheet, no load edits. Paint:
unobserved ⇒ no DOM class. Recommended semantics (uniform):
emit `(value, bp)` iff observed at a literal call-site
selection; uncalled recipes emit no responsive rules by the
same rule; fail-closed (full matrix) ONLY for non-literal
(dynamic/spread) selections. In-load yield = full 10.95 MiB.
WARNING: a per-recipe fail-closed (uncalled ⇒ full matrix)
saves only ~3 MiB (css ≈ 11.3) — the architect must rule
strict-vs-closed BEFORE implementation, because strict also
needs recipe-fixture call-site additions (all `ATM-RECIPE-0*`
fixtures are definitions-only inputs; under strict their
responsive output empties — same station question for both
moves, one ruling). Soundness homework for the crew: dead
files provably contain no `recipe` bytes (STYLING_SKIP needle,
`lib.rs:252-257`); live-file hand-written class strings need a
prefix-needle ruling. Churn (definitions-only, zero recipe
calls) is the strict-semantics proof: its responsive rules
vanish and paint holds trivially — bytes move per hypothesis.

## B2 — Publish the big bytes once

(a) Work skipped: `baseSystem.mjs` is pretty-stringified +
written with the 14.66 MiB portable sheet, then re-read,
`JSON.parse`d, re-stringified (pretty), re-written with the
real runtime; `styles.css` (14.3 MiB) is encoded + written
twice (styled leg + react copy).

(b) Lever: sync ≈ −50-100ms (patch ≈ 45 MiB IO + ~50ms CPU by
probe extrapolation: 1 MiB pretty-stringify ~1.5ms, parse
~0.65ms — worker B probe); transient RSS dips. All bytes
identical.

(c) Evidence (lead-verified): `sync/publish/system.ts:226-230`
(write) + `sync/publish/styled.ts:40-51` (re-read/parse/
re-stringify/re-write); `cssChunks` embeds the full portable
sheet (`system.ts:54-70`); second css write
`sync/publish/react-shell.ts:29`. Fix shape: thread `runtime`
into `publishSyncFolder` (write-once), single-encode +
`copyFile` for the react css copy. Publish is 242ms/9.2% of
sync (this burndown, down from 358 pre-W1).

(d) Disjointness: `sync/publish/*` + `sync/index.ts` only. B5
touches `publish/system.ts` as a shape-only type mirror
(different hunks — flag at merge, W1 a/c precedent). No other
lane touches these files.

(e) Out-of-bounds check: clean. Outputs byte-identical, no
load change, no clone. Note: react esbuild bundle,
typegen, and links are pinned-output real work — untouched.

## B3 — Gate proof-row materialization on the proof channel

(a) Work skipped: building `style_plans`, the per-atom `css`
map, the second recipe-table clone, and retaining `wants` in
the result on the default path — all dropped by slim serde
yet fully built every compile. (Workers B and C proposed
this independently — S2 and R1 are the same core; fused
here. The W2 crew reads both memos.)

(b) Lever: RSS ~30-40 MiB (20.1 MiB serialized-equiv ×
~1.5-2× in-memory: wants 10.08 + plans 4.72 + recipes 3.81 +
css 1.46, burndown-1 field measures) + build wall (`format!`/
clone per want/plan/atom over 7.5k wants inside the 612ms
assembly phase). Shipped bytes identical.

(c) Evidence (lead-verified): `assembly.rs:70` (plan build),
`:80` (`build_css_runtime`), `:93-96` + `runtime/builder.rs:296-303`
(table double-clone carrying dead combos/responsive maps),
`:111-116` (proof rows into result); slim drops all five
(`native.rs:126-140`, `SlimCompileResult`); `'proof'` already
rides `logs` (`native.rs:71-75`, `contracts/types.ts:156`) —
derive the flag from `request.logs` in `compile()`
(`types.rs:43`, `lib.rs:119` precedent).

(d) Disjointness: `assembly.rs` finish/css hunks +
`runtime/builder.rs` `build` + `types.rs` + `native.rs` + 1
line at `lib.rs:100-106` (ctx-init bool). B1 shares
`assembly.rs`/`lib.rs` files (different hunks — sequence).
B5 shares the `builder.rs`/`table.rs` region: B3 owns the
CLONE gating (proof channel), B5 owns the MAP BUILD skip
(`build_shipped`) — adjacent but separable hunks, sequence
with care (same-file different-function, W1 a/c precedent).
Untouched: `recipes/mod.rs` + `emitter/*` (B1),
`extract/*` + `hosts/*` + `styletrace/*` (B4),
`sync/publish/*` (B2 — output byte-identical).

(e) Out-of-bounds check: clean with one fence. Proof channel
restores everything when requested; stations/differential
read `proof`; no harvest/load/emission change. FENCE:
`style_plans` Vec gating must prove default diagnostics
byte-identical with proof off — `render_session` reads plans
before `partition_channels` strips compiler lines
(`assembly.rs:100-105` + `lib.rs:208-231`, lead-verified
coupling). The `css` map gating is fence-free (read by
nothing in-compile). Architect rules before implementation.

## B4 — Gate styletrace's second parse of all 15k entries

(a) Work skipped: 12k dead-file Oxc re-parses with fresh
allocators. Entry files with no `import`/`require`/`<` bytes
cannot define traceable style bindings (dead template has
none).

(b) Lever: sync ≈ bulk of `hosts` 125ms/4.7% (this burndown;
pre-W1 143ms, intact as predicted) + 12k transient arenas.
Zero byte change.

(c) Evidence (lead-verified): `hosts/entries.rs:11-18`
`entry_paths` ungated (only `is_file` filter — W1 staged
content but not re-parses); `styletrace/.../surface.rs:204-221`
→ fresh Oxc parse per file
(`styletrace/.../parser/mod.rs:55-65`); dead shape
`benchmark/generate/templates/dead.ts:5-14`.

(d) Disjointness: `styletrace/{surface.rs,parser/*}` +
`hosts/entries.rs` gate point + styletrace tests only.
Zero shared files with B1/B2/B3/B5. Cleanest lane of the
wave.

(e) Out-of-bounds check: walk-cost scrape. Fence: architect
proves the needle set (incl. the `require` CJS edge)
preserves trace selection; harvest untouched; no load
change.

## B5 — Derive recipe value classes at runtime + stop building dead maps

(a) Work skipped: shipping `variantMap` full class strings
(pure functions of shipped inputs), `base`/`qualifiedName`/
`className` dupes, per-recipe breakpoint repeats — plus
BUILDING `combinations`/`responsive_variant_map` in memory
(never serialized in any compile — lane d's explicit wave-2
cleanup).

(b) Lever: `runtime-data.mjs` 518 → ~315 KiB (−39%) +
bridge string/parse shrink; RSS ~7 MiB (dead IndexMaps) +
cartesian/`format!` wall over ~12k combos + ~20k responsive
entries. CSS bytes untouched.

(c) Evidence (measured this burndown): variantMap 201.3 KiB
(46.2% of table), responsiveBreakpoints 21.9, qualifiedName
20.5, base 19.2, className 11.0, variantKeys 17.6. Values are
exact fns: `variant_class(stem,axis,value)`
(`recipes/mod.rs:109-119`, `name.rs:25-28`), `base_class`
(`name.rs:21-23`); responsive derivation precedent already
in the browser runtime
(`reference-neo/src/runtime/recipe/recipe.ts:147-156`);
breakpoints filter one scale (`table.rs:77-84`) ⇒ hoist the
identical 440 × ~51 B lists to the artifact top level; ship
per-axis value-name lists (~199 → ~38 KiB). Dead maps built
`table.rs:29-31` (lead-verified), skipped
`runtime/plan.rs:60-63` — add `build_shipped()` for prod,
keep `build()` for unit tests (`table.rs:213+`,
`recipes/mod.rs:348`). `compoundVariants` (95.1 KiB) and
`defaultVariants` (30.5 KiB) KEEP shipping: multi-value
predicates expand to shared classNames (`table.rs:86-98`)
not invertible from a shipped single-value selection, and
defaults are authored data.

(d) Disjointness: `recipes/table.rs` + `runtime/plan.rs` +
`reference-neo/src/runtime/recipe/recipe.ts` +
`contracts/types.ts` (+ `sync/publish/system.ts` portable
type mirror — shape-only, flagged to B2). B1 owns
`recipes/mod.rs` + `emitter/*` (rules still need compiled
classes — untouched; W1 c/d precedent). B3 owns the clone
gating (adjacent hunks — sequence, see B3(d)). B4 untouched.

(e) Out-of-bounds check: clean. Same resolved classes
(derivation reproduces compiler strings exactly, incl.
first-char axis-prefix collisions — crew proves with the
E2E recompute lane d ran: 2376/2376 + 3960/3960 style);
paint + stations hold; the 5 NEO-RECIPE spec shape updates
mirror lane d's contract change, not a load change.

## Killed / deferred (with the floor bound)

- Utilities 2.18 MiB = content-deduped floor. `AtomSet` is
  `FxHashSet<Atom>` (`atom/set.rs:12-14`), class names are a
  pure content fn (`stylesheet/name/mod.rs:14-32`), one rule
  per atom (`cascade/mod.rs:184-188`). Growth comes from
  unique values, which dedupe equally for both engines.
  Namer/format changes would be out of bounds. No scrape.
- `fragments.prepare` 345ms (13.1%): scan-bound (`fg` over
  15k + 15k serial `readFileSync` + 5-needle `includes`,
  `scanner.ts:69-104`); only ~3 files match so esbuild ≈ 3
  builds. No provably-safe content skip exists (selection is
  exact-content-defined) — the honest lever is async
  bounded-concurrency reads, a parallelism change, not
  skipped work. Not a W2 lane; W3 or spike.
- Slim-payload codec ≈ 390ms (serde 293 + Δ96 JSON.parse +
  part of napi-bridge 161): sheets are 98.4% of the 29.82
  MiB slim string. The only further cut is ship-one-sheet =
  dual-sheet contract surgery = out of bounds (morning
  question). Shrinks automatically under B1 (payload → ~8
  MiB ⇒ codec ≈ ~100ms + proportional napi/RSS relief).
- Parse-phase co-residency (511 MiB, 34.6 KiB/file): per-file
  Oxc arena physics — 15.1k allocators + ASTs co-resident
  (`lib.rs:142-147`) with staged records/bags, constants,
  identity index. Streaming (parse→use→drop) is blocked on
  `ValueGraph` lazy origins borrowing all programs
  (`resolver/mod.rs:228-238`), `collect_pool` over all
  programs, and analysis borrowing all programs: a
  phase-architecture change, not a scrape. B3 takes the
  assembly-side scrapable part; the floor stands.
- `collect_project_constants` + `ValueGraph` staging stay
  deliberately ungated (12k dead `FACTOR_n` merged 2×,
  ~5-10 MiB + 2 walks): a naive styling-gate is UNSOUND (a
  styling-free file can still be an import origin). Sound
  gate is imported-or-live from `ModuleRecord`s — needs an
  architect soundness ruling first. W3 or spike, not W2.
- A9: 0, nothing left (two-census agreement).

## Morning questions

1. Ship-one-sheet (≈ 290ms codec + napi share + publish
   relief): dual-sheet contract surgery — out of bounds.
   Partially self-closes under B1.
2. A10 fixed namer tax (namer 57.9 + stylePropNames 24.8 KiB
   per compile, fully consumed): system-dependent
   (`for_system` reads breakpoints/widths/conditions/fonts,
   `runtime/tables/mod.rs:73-90`); spec-hash caching pays
   only in watch mode, never in the frozen one-shot sync
   metric. Stays a question.
3. Parse-phase streaming (the 511 MiB floor): phase
   architecture, needs an HQ-level ruling, not a night
   crew.
4. TOOLING WART (lead-found, firsthand): `deepsee/burndown.ts`
   `waitReady`'s 25ms poll loop never cancels on its 120s
   timeout — after a worker failure the parent parks in
   `kevent` forever instead of exiting (verified via
   `sample`: idle loop; fresh worktrees with no
   `node_modules` hit this on every run). Fix shape: clear
   the poll on timeout/reject and `kill()` the worker.
   Suggest the captain attach it to any W2 lane as a
   reviewed ride-along or fix it on the main line — it
   burns a box slot silently.

## Lane plan for Wave 2 (captain decides; recommendation: 4 crews)

- perf-2-a "observed recipe emission" (B1, both moves):
  gate responsive on observed literal selections + shake
  uncalled recipes. Architect rules strict-vs-fail-closed
  + fixture call-site additions BEFORE implementation
  (the ruling is determinative: css ≈ 3.4 vs ≈ 11.3).
- perf-2-b "dead product" (B3 + B5 fused, W1-a precedent):
  one hypothesis — objects dropped by slim serde or
  derivable at runtime are never built or shipped.
  Sequence inside: B3 (zero-byte, fence-proof first),
  then B5 (data reshape + `build_shipped()` + 5-spec
  renegotiation à la lane d). Shares `builder.rs`/
  `table.rs` region internally by hunk split.
- perf-2-c "publish once" (B2): write-once baseSystem +
  single-encode css copy. Smallest lane; byte-identical.
- perf-2-d "trace gate" (B4): styletrace entry gate. Fully
  disjoint; can merge first, any order.

Shared-file summary: `assembly.rs` + `lib.rs` (a/b3,
different hunks — sequence); `recipes/` dir (B1 `mod.rs`
vs B5 `table.rs`, disjoint files); `builder.rs`/`table.rs`
(b-internal hunk split); `publish/system.ts` (c logic vs
B5 type mirror, different hunks); contracts types (B5
sections only). Merge order suggestion: d → c → b → a
(independent first; emission-model change last, per the
brief's never-smash rule). Churn guardrail applies to a
(css moves per hypothesis — definitions-only churn proves
strict paint) and b (B5 data reshape); c/d may skip churn
only if the architect writes why (byte-identical,
wall-only).

Wave 2 recon: COMPLETE — map filed, 5 avenues, next crews:
perf-2-a (B1), perf-2-b (B3+B5), perf-2-c (B2), perf-2-d (B4)
