# Mission: voyage-robustness — harden the config/emit/exports surfaces

Status: CONCLUDED 2026-10-08 (Oracle FINAL `e7b67341e` —
`.agents/missions/voyage-robustness/reports/FINAL.closeout.md`). See `CLOSEOUT.md`.

Objective: make the one-shot `ref sync` / config-load / emission path robust —
deterministic bytes, no silent staleness, and proof machinery that cannot pass
vacuously. This follows `voyage-one-shot` (one-shot ~1.9 s → ~300 ms), whose
land exposed exactly these weaknesses.

## Candidate backlog (from filed follow-ups + accepted arc risks)

Wave 0 recon (see `reports/WAVE0.recon.md`) confirmed and **expanded** these:

| id | topic | status after recon |
| --- | --- | --- |
| **T1** | Emit-mode determinism | **Understated:** **4** files drift (`system/baseSystem.mjs`, `react/react.mjs`, `react/react.mjs.map`, `types/types.mjs`), **4** `import.meta.url` seams (`collect/lib/bootstrap.ts`, `packager/react.ts`, `packager/reference-types.ts`, `config/bundle.ts`). Not comments-only: `types.mjs` is a different module graph, `react.mjs` a different minified program, the map's `sources` differ. The pin is dist-mode; lib's documented `sync` is source-mode and **cannot reproduce it** (`verify-pins` FAILs 8). |
| **T2** | Silent stale upstream | **Confirmed** with a live demo: an altered lib `baseSystem.mjs` was served by docs `loadUserConfig` with **no warning**. |
| **T3** | Proof-harness hardening | **Confirmed:** `verify-pins` passes with no sync (vacuous); `capture-pins` crashes on a fresh clone (ENOENT); `measure-one-shot` measures an un-attested `dist`. |
| **T4** | Survey | 13 cited candidates (see `WAVE0.recon.md` §T4) — including packed-tarball stale `.reference-ui`, `check:dist` not covering generated bundles, and no microbundle normalisation seam. |

## Oracle plan (PLAN.oracle, pin `1d556dae9`) — backlog

Plan approved as restructured; T1 seams to `microbundle.ts:25-41` (`microBundleWithResult`,
all six call sites), not `build-options.ts`. Alias canonicalization rejected as
unsound. Line-preserving normalization required (react ships a linked map).

| id | item | note |
| --- | --- | --- |
| B1 | Cross-mode characterization harness + frozen bars | Wave 0; decides B2/B3 scope |
| B2 | Banner normalization at the `microbundle.ts` seam (blank column-0 `// <path>`, line-preserving) | first product land |
| B3 | Map live-relative sources (fix staged-commit orphan F-A) | same-land candidate |
| B4 | Producer freshness directness (`check:dist` += baseSystem; smoke requireFragment shape) | T2 remainder |
| B5 | Barrel guard follows config helpers (test-only) | F-B |
| B6 | `UPSTREAM_MARKER` Windows-tolerant | F-C |
| CUT | T2 config-load guard; T3 script hardening; compile-request relativize; alias canonicalization | — |

New survey finds: **F-A** staged commit orphans `react.mjs.map` sources;
**F-B** barrel guard file-scoped (a config helper importing the barrel silently
restores ~1.5 s); **F-C** Windows marker; **F-D** smoke asserts `name` only.

**Strategy ruled (DESIGN.oracle) — (C) unify the workspace on shipped dist
mode; B2 CUT.** `react.mjs` (minify:true ⇒ no banners), `types.mjs` (tsc-emit
twin vs raw-src graph), and the map's mappings are genuinely **content-class**;
output normalization cannot meet byte-identity, and resolution canonicalization
has no fresh-checkout-safe form. docs/icons already run dist; **only lib's
scripts are source-mode** (`sync`/`typecheck`/`build`/`dev` →
`node ../reference-neo/bin/ref.ts`). Rule: point lib's documented paths at the
dist CLI behind a new neo-owned **dist freshness gate**, so dev == ship == pin
with **zero emitted-byte change** (empty pin diff); content-class drift becomes
a documented mode-scoped residual (source mode = neo inner-loop only).
"Content surgery" rejected. Revised backlog: **C1** (core land) → **B3-depth**
(map live-relative sources, F-A) → micros B4+B5+B6 → closeout. CUT reaffirmed:
B2 blanking, B3-xmode, T2 config-load guard, T3 script hardening, alias
canonicalization.


## Doctrine

Same as `voyage-one-shot` (see its `GATES.md`): fresh repro first; counts-first
falsification with an exact numeric gate; byte/semantic identity proven; one
working tree (serial implementers, Oracle reviews overlap); bench-lock timed
blocks; crews never commit, the captain re-runs the decisive gates and commits
one verified arc per commit; Oracle plan review now, an arc review per land, and
a final closeout review.

## Waves

To be set from `PLAN.oracle`. Likely shape: Wave 0 recon (reproduce the drift
with a counts/bytes harness; enumerate gap candidates), Wave 1 = highest-value
robustness land, then the next, then closeout.

## Logs

`.agents/missions/voyage-robustness/` — `WAVE*.md`, `briefs/`, `reports/`
(gitignored), `CLOSEOUT.md`.
