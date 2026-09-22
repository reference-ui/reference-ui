# INTEGRATE.md — swarm-intmcp: wave-3 off-scope MCP BANKs (catpost + prelower)

Integrator for the 2 HQ scope-widened off-scope MCP BANKs. Judge and prove — no new diets.

- Base pin: `1b4effaba43649866261ec4a4ae8ae78b8da58df` — verified FIRST via `git rev-parse HEAD` (match).
- Members: PERF-W3-CATPOST (prebuilt category postings) + PERF-W3-PRELOWER (lowercase-once-at-load).
- Both touch ONLY `packages/reference-mcp/src/pipeline/icons-search-index.ts`. Fences held:
  Formula-1 ground untouched, nothing outside `packages/reference-mcp`, no commits, no pushes,
  never LOG.md, never `git stash` (file asides in `/tmp` only).

## 1. Rebase record (reproduce exactly)

Banked patches were vs `1e1ad31d9`; tip carries the rawindex LAND (loadJS block) in the same file.

- `git apply --check`: `catpost.patch` FAILS at `:73`, `catpost-B.patch` FAILS at `:73`
  (base context `const jsonString =` replaced by the loadJS block, tip L87-92).
  `prelower.patch` and `prelower-B.patch` apply cleanly to tip.
- Order: **catpost-A first** (structural), **prelower-A second** (adaptive), both by hand:
  1. Catpost-A: interface + fields after `trimDescription` (tip L73-78); ctor postings build
     fused into the tip L94-109 loop keeping L87-92 loadJS verbatim; browse block (tip L285-316)
     replaced by the postings lookup. Result: **+32/-15, exact banked stat** (sha `d10b39c8…`).
  2. Prelower-A standalone (proven separately first): `git apply prelower.patch` on clean tip,
     **+12/-4, exact banked stat** (sha `f7aafc71…`), then asided.
  3. Composed: prelower ctor hunk fused into the catpost ctor loop (lower in place, key
     postings on `lower`); searchDemand filter hunk applied verbatim; browse-filter hunk
     DROPPED as subsumed (browse no longer filters — proven by grep, §3).
     Result: **+38/-17** (sha `283f3566…`). Full diff in §9; tree filed in this state.

## 2. Race adjudication (A-vs-B, hunk-by-hunk, count probes; first SOUND wins)

Census on clean tip (`/tmp/intmcp-census.mjs`, untimed): 3857 docs, 18 categories,
1114 multi-category docs, **0 docs with duplicate categories, 0 same-lower-key collisions,
0 non-string categories, 0 uppercase categories, wildcard order == insertion order: true**.

### CATPOST: A wins all three hunks — B YIELDS

| Hunk | A | B | Evidence |
|---|---|---|---|
| types+fields | `categoryPostings` + `allPostings` (covers no-category edge) | `categoryIndex` only, no-category falls back to wildcard | order probe true + `edge:blank-demands` sha-identical under A (§4): A's hunk sound and strictly more capable |
| ctor build | plain push per category | per-entry dedupe `Set` | 0 dup/same-key docs → buckets identical on real data; B allocates 3857 throwaway Sets for zero behavior change |
| browse | unified lookup, shared readout map | inlined readout dup + legacy wildcard fallback | B's fallback costs **3857 filter invocations/call** (counted on tip) vs A's 0; A's `allPostings` byte-identical to legacy |

A soundness: 8-pair browse 349.011→0.671µs 8/8 + identity 79/79 + suites 12/12 → SOUND.
First sound wins → **catpost-A**. B never needed timing (yielded on evidence, race rule).

### PRELOWER: A wins — B YIELDS

| Hunk | A | B | Evidence |
|---|---|---|---|
| ctor lower | in-place, writes only if changed | `.map` always reallocates | upperCat=0 → A does **0 writes / 0 allocs**; B allocates 3857 arrays for identical end state |
| searchDemand + browse filters | `===` | `===` | semantically identical — tie |

A soundness: **full 8-pair** (deviation cured: browse −32.2µs 8/8, demand −31.5µs 8/8)
+ identity 79/79 + suites 12/12 → SOUND. **prelower-A**. B yields.

## 3. Collision analysis (tip file:line)

- catpost-A ctor hunk × rawindex LAND (tip L87-92): context overlap → hand-rebased, L87-92 verbatim.
- catpost-A × prelower-A ctor loop (tip L99-107): OVERLAP → fused by hand (§1 step 3).
- prelower-A browse-filter hunk (tip L285-291) × catpost-A browse rewrite: SUBSUMED →
  hunk dropped; only 3 `toLowerCase` sites remain in the composed file (L120 load,
  L198 per-demand query norm, L236 per-browse category norm) — no filter lowers anywhere.
- prelower-A searchDemand hunk (tip L173-179): DISJOINT → applied verbatim.
- Each survives the other: LOO both directions measured (§5) + composed lowers census
  (browse 4978→**1**, demand 549→**4**) shows both mechanisms live in one tree.

## 4. Off-scope proof — equivalence + mechanism (per member + sum)

**Identity battery** (`/tmp/intmcp-identity.mjs`, 79 cases, sha-compare vs tip baseline
`/tmp/intmcp-baseline-tip.json`): archived 42-case shape (18 cats × l25/l100v + nonexistent
+ blank-demands ×2 + upper-cat + query-trash) + **mirrors of all 12 icons-catalog tests**
(t01 guidance incl. `ICON_CATEGORIES`, t02–t08 queries, t09 multi-demand, t10 demands array,
t11 nav-l10v, t12 arrow-l5) + 24 prelower mixed-case demand cases.

| Arm | Identity | Lowers (load/browse/demand) |
|---|---|---|
| tip | baseline (79 saved) | 0 / 4978 / 549 (= banked 4978/549 exact) |
| catpost-A | **79/79 sha-identical** | 5002 / **1** / 549 |
| prelower-A | **79/79 sha-identical** | 5002 / **1** / **4** (= banked 1/4 exact) |
| composed | **79/79 sha-identical** | 5002 / **1** / **4** |

Banked census figures (4978/549, 1/4) independently reproduced to the digit.
Load-time lowers (5002 = one per stored category) are the once-per-process prebuild cost.

## 5. Off-scope proof — bench-locked 8-pairs (esbuild bundles, fresh process, §6)

Harness: `esbuild 0.28.2`-bundled real tree modules (minisearch + 5.27MB JSON inline),
bundles built once per set (never rebuilt mid-set), **sha256-verified before AND after
every run** (harness aborts on mismatch — zero aborts), deterministic rotation (no RNG),
warmups unscored, drift-alternated start side. Bundles: tip `7be86018…`,
catpost `b7950d55…`, prelower `be04990c…`, composed `87e7ef21…`.

**catpost-A standalone** (browse kind): before medians per pair
345.7/348.2/350.2/355.1/346.5/349.0/347.1/351.1µs → **349.011**;
after 0.944/1.711/0.646/0.655/0.652/0.652/0.671/0.686µs → **0.671**.
Δ=**−348.340µs (−99.8%), agree 8/8**. Load 207.58→210.27ms (+2.7 one-time).
(Banked 374→1.9µs re-proven same-shape, stronger. Pair-2 after=1.7µs outlier disclosed —
still 200× its pair-before; medians robust.)

**prelower-A standalone** (demand kind — full 8-pair, deviation cured):
browse 358.785→326.562µs, Δ=**−32.223 (−9.0%), 8/8**;
demand 1469.075→1437.570µs, Δ=**−31.505 (−2.1%), 8/8**. Load 208.82→207.83 (no regression).

**Composed sum** (demand kind): browse 359.713→0.475µs, Δ=**−359.238 (−99.9%), 8/8**;
demand 1473.288→1444.860µs, Δ=**−28.428 (−1.9%), 8/8**. Load 208.34→212.46 (+4.1 one-time).
Per-pair tables: all 8 agree in all 3 sets (full tables in /tmp, quoted in claims).
LOO bisect: sum−catpost ≡ prelower standalone (demand −28.4 ≈ −31.5 ✓ survives);
sum−catpost-browse −359.2 vs standalone −348.3 differs only by cross-hold baseline drift
(±3%; within-hold pairing is the verdict unit); prelower's browse prong is subsumed by
construction (wildcard browse gone) — disclosed, not hidden.

## 6. Extension-safety

- **Importer graph** (TS): `icons-search-index.ts` ← `icons-catalog.ts:8`
  (`searchIcons`, `ICON_CATEGORIES`) ← `server/tools.ts:23` (list_icons handler, L364)
  + `server/universal-primitives.ts:9` ← `tools.ts:22`, `resources.ts:5`.
  All inside `packages/reference-mcp`. **Zero references** to `reference-mcp`,
  `icons-search`, `icons-catalog`, `IconsSearchEngine` in `packages/reference-core/src`,
  `packages/reference-rs`, `pipeline/src`. Rust-to-TS: `.rs` cannot import TS; the N-API
  direction is TS→Rust (`reference-mcp` depends on `@reference-ui/rust`) — one-way by construction.
- **Sync-denominator 8-pair 0-confirm** (`/tmp/intmcp-sync-pairs.mjs`, bench-locked,
  16× enterprise seed-7 fresh-child samples, alternating tip/composed tree):
  syncMs medians before 919.81 / after 916.60, Δ=**−3.22ms (−0.35%, noise)**,
  afterWins **4/8** (coin flip), `totalBytes=3082391×16 EXACT`, `cssCalls=7527×16 EXACT`.
  Output bytes prove sync untouched; timing delta is noise. **0 CONFIRMED — no veto.**

## 7. Suites (file asides, never stash) + TS quality gate

- Full MCP suite `pnpm --dir packages/reference-mcp exec vitest run`:
  tip = 47/51 pass (4 failed in `build.test.ts` + 7 files fail import on missing
  `@reference-ui/core/*` dist — pre-existing environmental, enumerated from
  `/tmp/intmcp-fails-tip.txt`); composed = **byte-identical FAIL/Error set**
  (`diff` of stripped outputs: no differences). `icons-catalog.test.ts` (touched area):
  **12/12 on tip, catpost-A, prelower-A, and composed**.
- Carried-over tests: **NONE** — delta = ∅ (no test files added or modified; parity
  battery ran as a `/tmp` aside and is quoted in §4).
- TS gate (exact commands): `pnpm --dir packages/reference-mcp run typecheck`
  (`tsc --noEmit`): **7 errors on tip AND composed, all pre-existing** in
  `../reference-core` (missing `@reference-ui/styled` types), **0 in the touched file**,
  delta 0. No lint script/config exists in-repo (no eslint/biome) — typecheck is the gate.

## 8. Solo-LAND bar on the surface denominator + what was NOT done

- Bar (§3 on surface): ≥15ms AND ≥1.5%. Catpost: −0.348ms / −99.8% (relative ✓,
  absolute ✗ — surface totals 0.35ms; 15ms incommensurable). Prelower: browse
  −0.032ms/−9.0%, demand −0.032ms/−2.1% (relative ✓, absolute ✗). Sum likewise.
  → Neither clears solo-LAND without captain sign-off → **BANK-track per member**.
- NOT done: B variants never timed (yielded on count evidence, race rule); no new diets;
  matrix/mcp + pipeline suites out of surface scope (MCP package suites are the contract);
  load +4.1ms one-time disclosed, not optimized; LOG.md untouched; no commits.

## 9. Landing record

Filed tree = composed winners (`M icons-search-index.ts`, sha `283f3566…`, +38/-17);
`git diff` IS the landing patch (recipe §1). Asides: tip `9df654d2…`, catpost `d10b39c8…`,
prelower `f7aafc71…` (`/tmp/intmcp-*-icons-search-index.ts`); bundles + batteries in
`/tmp/intmcp-*`. Bench `latest/` restored, stray pin dir removed, `git stash` never
touched. Bench protocol: 2 holds, 2 two-step releases, 4 claims lines, lock never
vanished, no foreign noise observed (no foreign claims during either hold).

FINAL: BANK × 2 CONFIRMED as one composed sum — catpost-A + prelower-A both SOUND (8-pair + 79/79 identity + 12/12 suites), races adjudicated (both B variants YIELD on count evidence), sum-confirmed (browse −359.2µs −99.9% 8/8, demand −28.4µs −1.9% 8/8), sync 0-confirmed, suites/typecheck delta-clean — LAND-ready pending captain firsthand + sign-off; nothing CUT.