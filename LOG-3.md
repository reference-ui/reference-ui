COMPLETE

# LOG-3 — Objective 3: lib sync ~650ms

Brief: [VOYAGE.md](./VOYAGE.md) Objective 3. Lands one commit.
Crew shape: voyage captain protocol (research → implementers →
reviewers; captain verifies firsthand and commits).

## Status

Briefed as an open investigation — no cause stated, hunch deliberately
withheld so the crew determines it independently. Probe crew
(lib-sync-probe) returned 2026-09-22, read-only.

Probe findings (feeds objective kickoff):

- `dev:lib` pays two full Neo syncs (one-shot + watch baseline); the
  651ms is one `sync()`, comparable to bench `syncMs`.
- Only 325 ts/tsx files in scope (1.97 MB) — file count ruled out as
  primary. Engine/path correct (release N-API, Neo sync, single read,
  no backfill); dist/node_modules/snapshots excluded.
- #1 cause: the engine skip gate fails on 324/325 files (keys on
  `import`, which every file has), so every test/story/fixture rides
  the full retained-file pipeline. ~69% of bytes are dev-only.
- #2: barrel tracing — `src/index.ts` is 211 KB with ~3,890
  re-exports + 26 `export *`, each resolved through StyleTrace.
- #3: fragment-bundle fan-out — 32 esbuild bundles vs bench's 2.
- Fix direction: narrow `include` with negations (tests, e2e,
  stories, books, fixtures) after verifying negation support.
- Confirming probe (needs approval, rewrites lib `.reference-ui`):
  `REFERENCE_UI_PHASES_OUT=/tmp/neo-lib-phases.json node
  packages/reference-neo/benchmark/measure/worker.ts
  packages/reference-lib 5`

## Research crew — WORKING (2026-09-23)

## Research

Crew: obj3 research (voyage, read-only). Tree: Obj-2 stepped commits
landing mid-session (`c75a22488` → `d17b67d8f`, incl. typegen widen
`2fa8598a7`); Dagger VM contention throughout (load 8–11, swap 2.6GB
used). Absolute numbers are contended-box; shares and A/B deltas are
same-window and robust. Re-measure on a quiet box at implement time.

### (1) Breakdown — what is synced, where ms go

Scope: `packages/reference-lib`, include
`['src/**/*.{ts,tsx}', 'book/**/*.{ts,tsx}']` → 325 candidates, 325
retained (1,920 KB). Fragment matches: 31 files (all under
`src/core/theme`; zero in dev-only files) → 31 esbuild bundles.

True phase medians (absolute dir, N=5 cold workers; contended ≈1000ms;
probe's quiet-box 651ms is the same shape):

| phase | median | share | sub-split |
| --- | --- | --- | --- |
| compile | 798ms | ~80% | barrel ~346 / rest ~361 (see below) |
| scan | 71ms | ~7% | fg-enum ~9, native read+gate ~10, 31 esbuild bundles ~33 (3.5ms/file, parallel) |
| publish | 47ms | ~5% | react ~23, refTypes ~15, types ~7, syncFolder ~5, runtime ~0.5 |
| residual | 33ms | ~3% | cleanDir + inter-mark gaps |
| config | 21ms | ~2% | esbuild-bundle ui.config |
| evaluate | 15ms | ~2% | fragment eval |

Compile A/B (in-process battery, 3 reps each, tight ±3%):

| variant | retained | compileMs | css bytes/sha | hosts |
| --- | --- | --- | --- | --- |
| A full | 325 | 715/698/714 | 242953 / 75287e33f144 | 53 |
| Dbar full minus `src/index.ts` | 324 | 375/349/358 | IDENTICAL (css + portable sha, hosts, 0 diags) | 53 |
| BARREL-ONLY | 1 | 350/346/342 | 80437 | 0 |
| TOASTSYS-ONLY (34KB prod file) | 1 | 15/13/13 | 80675 | 1 |
| C full minus 117 dev-only files | 180 | 577/590 | 136909 (CHANGED, −106KB) | 53 |

Dev-only census: 117 files / 988KB / 51.5% (ct.spec 408, fixtures
211, books 205, tests 135, book/ 39, story files rest). Skip gates
(current tree, deterministic): styling-keep 277/325, trace-keep
319/325 — the gate is 4 needles (`import`/`css`/`recipe`/`<`), not
`import` alone (56 files lack `import`; `from` keeps 313 for trace).

### (2) Root cause (proven)

The `src/index.ts` barrel (211KB, 3,889 re-exports + 26 `export *`)
costs ~346ms — 49% of compile, ~35% of sync — for byte-identical
output. Proof: (a) excluding it leaves every artifact field equal
(css sha, portable-stylesheet sha, 53 traced hosts, 0 diagnostics,
3/3 reps); (b) additivity: A−Dbar ≈ 347ms ≈ barrel-alone 346ms, so
the cost is independent of the rest; (c) it is resolution, not bytes:
a 34KB prod file costs 14ms while the 207KB barrel costs 25× more.
Mechanism: StyleTrace re-resolves the barrel's ~3.9K re-export edges
(~88µs/edge, disk-graph walk + staged map) even though every target
is already a direct compile entry — pure redundancy (barrel-alone
still emits 80KB via disk-graph tracing, but the full set covers all
of it without the barrel entry).

Second-order: skip-gate failure is real (277/325 ride full walks)
but worth only ~1.1ms/file (~361ms over 324 files). Dev-file
exclusion saves ~124ms compile but is NOT output-identical (dev
call-sites harvest 106KB of the stylesheet) — a semantic scope
decision, not a free win. Fragment bundling (31 esbuild bundles,
~33ms) is minor.

Corrections to probe: 31 bundles (not 32); gate is 4-needle
(277/319 keep, not 324); the confirming probe must use an ABSOLUTE
dir (see below).

CRITICAL side finding (correctness, out of scope to fix): a
relative project dir silently degrades sync — engine compiles the
barrel alone (output BYTE-IDENTICAL to BARREL-ONLY, 80KB vs 243KB,
427 vs 2028 classes, ~11ms compile). Suspect: scope matcher against
relative root in `collect_drained` (`matcher.matches_file` drops
324/325). Shipped path is safe (CLI resolves to absolute), but every
benchmark/probe must use absolute dirs. Flagged to captain.

Also confirmed: `dev:lib` pays two full syncs at startup (one-shot +
watch baseline, `watch.ts:284`) — a startup multiplier, not per-sync
cost.

### (3) Fix direction + effort + risk (output-identical)

1. NOW (XS): add `'!src/index.ts'` to lib `ui.config.ts` include.
   Proven output-identical above; expect ~−35% sync (~−45%
   compile). Validation passes negations (array-only check);
   walkComplete honors single-`!` (backfill skipped, retained 324).
   Risk if unguarded: a future style call-site in the barrel would
   silently drop — ship with a guard test (compile ± negation,
   diff artifact hashes) + comment. Re-verify quiet-box medians +
   chain gate at land time.
2. DURABLE (RS-owned, S/M): engine skips pure-reexport entries (no
   own style call-sites) as trace/extract entries, or memoizes edge
   resolution across entries. Generalizes (1) to every barreled
   package. Keep C1 diagnostics behavior (failed entries stay).
3. NOT recommended: dev-file negations — violate output-identical
   (−106KB css). Only under a redefined dev-output scope (~124ms).

Probes: `/tmp/obj3-{probe,census,battery,confirm,ab2}.mjs` (read-only;
only lib `.reference-ui` rewritten, gitignored, per authorization).

## Research crew — DONE (2026-09-23)

## Research acceptance (captain, 2026-09-23)

RESEARCH ACCEPTED. Root cause proven with tight
numbers: the 211KB barrel costs ~346ms (49% of
compile) for byte-identical output (additivity +
3-rep artifact equality); skip-gate + bundling
second-order; dev-exclusion correctly REJECTED (not
output-identical, −106KB css). Fix = XS negation +
guard test; durable RS fix filed as follow-up.
CRITICAL side finding CARRIED (engine correctness,
out of Obj-3 scope): relative project dir silently
degrades sync to barrel-only output — needs a crew
outside this objective. Implementer dispatched.

## Implementer — WORKING (2026-09-23)

Plan: (1) before-medians + before-artifacts on the pristine tree,
(2) land `'!src/index.ts'` + honest comment in lib `ui.config.ts`,
(3) guard test compiling ± negation and diffing artifact hashes,
(4) after-medians + artifact diff, (5) affected Neo cases
(NEO-CHAIN-01..06 + NEO-PARITY-03, the live lib-src census).

## Implementer — DONE (2026-09-23)

Landed the XS fix in 2 files, no engine/dev-scope/relative-dir touch.

Change:
- `packages/reference-lib/ui.config.ts`: include gains `'!src/index.ts'`
  + honest comment (cost, byte-identical basis, WARNING, guard pointer).
- `packages/reference-neo/src/sync/lib-barrel-negation.test.ts` (new):
  loads the live lib config, compiles ± negation through the real
  scan→bundle→evaluate→compile path, and asserts identical css/portable
  sha+bytes, traced hosts, fragment matches, and diag counts, 0 errors
  both legs, retained diff exactly 1, and the negation present (fails
  rather than passing vacuously if removed).
- Home note: the guard was first written in lib src (vitest include
  covers it) but lib tsc has no `allowImportingTsExtensions`, so crawling
  neo sources added 51 TS5097 errors. Relocated to neo colocated vitest
  (PARITY-03 precedent: lib tree read as data, never imported). Lib tsc
  is byte-identical to its pre-existing baseline (2 playwright/ct.ts
  errors, another crew's); neo gate + package tsc clean.

Proof 1 — medians, same quiet box (fresh workers, absolute dir, N=5;
load ~2.0 before, ~1.9–2.5 after; Dagger woke mid-after-battery, noted):

| phase (steady medians) | before | after | Δ |
| --- | --- | --- | --- |
| syncTotal | 648.3 | 318.9 | −329.4 (−51%) |
| compile | 520.4 | 192.4 | −328.0 (−63%) |
| scan / publish / config / eval | 43.9/35/15/8.6 | 44.9/34/16/9 | unchanged |

Before runs 2–5 (run 1 = 1698ms page-cache cold); after runs 1–5 clean.
Brief expected ~−35% sync — that share was computed on the contended
~1000ms box; absolute ms agree with research (barrel ~346 contended,
~328–330 quiet). The ENTIRE win is compile; all other phases flat.
3 extra after-samples (310–382) + 1 outlier (522ms, Dagger spin-up
window; run-6 phases blame scan 113 vs 45, compile steady 198) — median
over 8 is 322.3, robust. Raw: /tmp/obj3-impl-{before,after}-phases-*.json.

Proof 2 — output-identical: guard green (`pnpm agent vt`, 1.4s);
negative control (drop colors.ts instead) fails 8-error as required.
Full-sync artifacts before→after: 447/447 same fileset, byte-identical
EXCEPT `system/compile-request.json`, whose diff is the include echo
only (spec identical per evaluated-system.json). Before css sha
`75287e33f144…` matches research variant-A sha12 exactly. (Transient:
while the guard lived in lib src, tasty indexed it as +1 chunk
`CompileFingerprint`; after relocation tasty reverted byte-identical —
deterministic, not noise.) Snapshots: /tmp/obj3-impl-{before,final}-artifacts.txt.

Proof 3 — chain gate: NEO-CHAIN-01..06 all PASS (transitive, diamond,
parallel, multi-extends, depth, real-upstream) + NEO-PARITY-03 PASS
(live lib-src census). No Dagger per brief. `agentneo q` on the guard:
0 errors, 0 warnings; neo package typecheck clean (case run gates it).

## Implementer acceptance + OBJECTIVE COMPLETE (captain, 2026-09-23)

IMPLEMENTER ACCEPTED. Verified firsthand: guard test
PASSED on my run; config change exactly the designed
one-line negation + honest WARNING comment. Crew
proofs: quiet-box medians 648→319ms (−51% sync, −63%
compile, all other phases flat), 447/447 artifacts
byte-identical (compile-request echo only), negative
control fails as required, CHAIN-01..06 + PARITY-03
green, q clean. Done-criteria met (root cause proven,
output identical, number down). Landing one commit
per Obj-3 law. Durable RS fix + relative-dir
correctness bug carried as voyage follow-ups.
