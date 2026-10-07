# FINALIZE.md

The living ledger for wrapping Reference UI up. Everything that is *not yet
finished* or *deliberately not done* lives here — one line each, with where it
lives and why it does not block. If it is settled, it leaves this file.

**Status legend:** `OPEN` (do it) · `NOTE` (decide later) · `FILED` (bug doc) ·
`CUT` (ruled out, do not revive without new evidence) · `DONE` (tick and remove).

Last updated: 2026-10-08.

---

## Open items

| # | item | status | where / notes |
| --- | --- | --- | --- |
| F-1 | **Drop tsup — package every lib like icons/neo** | RULED (esbuild) | Oracle `TSUP.oracle`: use **raw esbuild** behind a small node script, not rollup/tsc-only. Census: lib + 8 matrix fixtures + mcp + rs. Arc A (lib) queued behind WAVE5. See "## F-1 detail". |
| F-2 | **Non-atomic `dist` rebuild** | FILED | `LIB_DIST_ATOMIC_BUILD` (Oracle CONC-P3-1). tsup `clean: true` wipes `dist/` before rewrite → a live dev server briefly 404s `dist/index.mjs`. Bar: "lib rebuild during a live dev server produces zero 404 windows." See `docs/bugs/LIB_TASTY_RUNTIME_404.md` symptom 3. Likely dissolves with F-1. |
| F-3 | **`normalizeConfigDependencyPaths` Win32 gap** | FILED | `packages/reference-neo/src/config/bundle.ts:30` treats only `/`-absolute metafile keys as absolute. Needs a real Windows runner to verify (a POSIX-hosted Win32 unit test would mislead). |
| F-4 | **mcp dist-content tripwire** | NOTE | Oracle ARC-P4-1 / CONC-P4-3: assert mcp `dist` carries no unexpected content. Cheap tripwire, not a gate. |
| F-5 | **Native MDX support** | OPEN | Separate mission; durable plan `.agents/missions/finalize/PLAN-mdx.md` (Oracle-approved). Captain session dispatched 2026-10-08 (worktree `mdx-support`). |
| F-6 | **Repo loose-file cleanup** | OPEN | Owner note 2026-10-08: the repo is getting messy — remove stray/marked-out files. See "Cleanup backlog" below. |

## F-1 detail — dropping tsup / unifying package builds

Owner, 2026-10-08:

> "Ideally, we package up every reference lib in the same way as we do
> reference icons. … look at reference neo, it's such a simple thing. Strip away
> all the bullshit and all the old stuff with tsup and all the dependency around
> it. It's an unmaintained library, so if we could avoid using it, that would be
> great."

> "I don't know what the stable, vanilla packager we should use for this. Maybe
> it's esbuild, maybe it's rollup — toss-up between those two."

Decision axis: **esbuild vs rollup** (the Oracle rules). Both are stable and
already in-tree — `reference-neo` uses `esbuild@^0.28`; `reference-icons` uses
`rollup@^4.59` + `rollup-plugin-esbuild` (so esbuild is present either way).

Recon (`package-unify-1008`):

| package | bundler | types | notes |
| --- | --- | --- | --- |
| `reference-lib` | **tsup@^8.5.1** | `tsc -p tsconfig.build.json` | `dist/index.mjs` + `dist/theme/index.mjs`; `clean: true`; externals react/react-dom/@reference-ui/react+styled; `noExternal: gsap` |
| `reference-icons` | **rollup@^4.59** + `@rollup/plugin-node-resolve` + `rollup-plugin-esbuild` | `tsc -p tsconfig.build.json` | the target shape |
| `reference-neo` | **esbuild@^0.28** (`tools/build-bin.mjs`, 148 lines) | `tsc` | the "simple thing" model |

Coupling to watch when removing tsup: `materialize-runtime.mjs` `bundleRewrites`
and `build-package.mjs` assume the tsup output shape; `check-dist-fresh.mjs`
references tsup; the consumer smoke asserts the packed `dist`; the helper leak
traces to **tsc** (`rewriteRelativeImportExtensions`), not tsup.

Oracle design consult: `briefs/TSUP.oracle.md` → report
`reports/TSUP.oracle.md`.

**Oracle ruling (2026-10-08): raw `esbuild` behind a small node script** — not
rollup, not tsc-only. ~70-line `scripts/build-bundle.mjs`; keep the 2-entry
fat-file `dist` contract (`index.mjs` ~2.1 MB + `theme/index.mjs` ~77 KB).
Compute externals from `package.json` (bare **and** `/*` subpath form) — the trap
is silently inlining `zustand` and `@reference-ui/icons`. Rollup is out (perf;
it exists in icons only for `preserveModules` over hundreds of generated icon
entries); tsc-only is out (path aliases need the bundle step, `gsap` inlining,
multi-file contract). The helper leak is input-side (tsc) and WAVE5 fixes it
bundler-agnostically.

**Census:** `reference-lib` + 8 `matrix/fixtures` + `reference-mcp` +
`reference-rs` use tsup; `reference-legacy` is workspace-excluded (leave inert).
**Arcs:** A lib → B fixtures → C mcp → D rs → E prune the lockfile (`tsup` gone,
esbuild deduped 0.27.3→0.28.2). **Bar (`TSUP-7`):** scripted dist-contract
parity, unmodified consumer smoke green, docs build clean, perf ≤ baseline.
Smallest first arc = **lib only**. **Queued behind WAVE5** (both edit
`check-dist-fresh.mjs` — coordinate, don't merge).

## Known pre-existing reds (not ours; do not re-litigate)

| red | note |
| --- | --- |
| `bin/ref.test.ts` verbose-wording drift | hint text vs RS template; fails identically with/without the robustness body. |
| Flaky `clean-repro` / `session-repro` lock-kill | environment/`FORCE_COLOR` interaction (8/8 pass raw). |
| Matrix mcp 8 failures | pre-existing; barrel/subpath-identical outcomes. |
| Neo full-suite single failure | same `bin/ref.test.ts` wording item, not a new red. |

## Accepted residuals

- **Content-class emit residual** (source vs dist mode: `types.mjs` graph,
  `react.mjs` minified program, map mappings). Source mode is the neo inner-loop
  only; shipped bytes are dist-only + pinned. Doc: `docs/bugs/NEO_EMIT_MODE_DRIFT.md`.

## CUT (ruled out — do not revive without fresh flames)

B2 output normalization/blanking · B3 cross-mode map identity · T2 config-load
staleness guard · T3 mission-script hardening (the `sync.lock` pin-walk exclusion
is the same class as `tmp/`, not T3 revived) · compile-request relativize · alias
canonicalization · narrow-bootstrap-entry · content surgery.

## Cleanup backlog

Criteria: generated scratch, editor/pack artifacts, superseded duplicates, and
files marked for removal — **never** another mission's active work or the user's
files.

**Removed 2026-10-08:**

- `test-script.mjs` — 4-line throwaway (read a Playwright results.json).
- `test-standalone.spec.ts` — 7-line throwaway spec hitting `localhost:3101`.
- `REPORT.md` — explicitly marked *SUPERSEDED 2026-09-29 by `FINISH.md`*.
- `.agents/missions/voyage-robustness/FOLLOWUPS.md` — folded into this file.

**Reviewed, kept (intentional HQ/docs history):**

- `DECISIONS.md`, `WANTS.md`, `DIAGNOSTICS.md`, `FINISH.md` — HQ working docs.
- `LOG.md` — 14-line live stub pointing at a `docs/PERF` archive; decide later.
- `review.md` — 2026-10-07 working-tree review; recent, keep until superseded.
- `sync-perf.html` — one-off perf page; candidate to move under `docs/PERF/` or
  delete once its numbers live in a report.

**Done 2026-10-08 (cleanup pass 2, Oracle-triaged):**

- Archived **7 unreferenced** mission dirs → `.agents/missions/archive/2026-10-08-<name>/`
  with a `STATUS: closed` line each (`39931e410`): `cleanup-0925`,
  `doom-night-0924`, `hints-0925`, `numberfield-wave2`, `red-team`, `seam-0925`,
  `smoke-oracle`.
- Kept in place (**live provenance refs**, verified by `git grep`): `quarantine-landing`
  (27 refs from shipped component `DECISIONS.md`/`PATCHES.md`), `playtest` (4),
  `finish-line` (2), `landing-sequence` (2), `continuity` (1), `sharp` (1).
  *The Oracle's plan over-archived these — attribution fix recorded.*
- Kept `sync-perf.html` **at root** — `docs/MISSIONS/LOG-2.md:9191` carries an
  HQ standing order to keep it there (the Oracle's move would break it).
- `FINISH.md` header now points at `FINALIZE.md` as the tracker.
- Stray `reference-ui-lib-0.0.46.tgz` already gone; added `*.tgz` to `.gitignore`
  so `npm pack` strays can never be committed (tracked `.tgz` count is 0).

**Still open:**

- [ ] **CLEANUP-3 ruling** — `styletrace_perf/plan.md` says "PLANNED" while
  `LOG.md`/`dd0989ad7` say "landed"; owner must rule before that dir moves.
- [ ] Archive `finalize/` (after MDX lands) and `voyage-one-shot/` (pins are live
  until `voyage-robustness` closes) — per CLEANUP-1/CLEANUP-2.
- [ ] Disk-only prune of ignored `.pipeline/**` (102 GB) and `.store/**` (259 MB)
  — no tracked changes; skipped here (does not affect repo cleanliness).
- [ ] `review.md` — delete once `reference-system` merges or it predates HEAD by
  >14 days.
