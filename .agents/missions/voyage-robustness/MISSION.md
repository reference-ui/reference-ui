# Mission: voyage-robustness — harden the config/emit/exports surfaces

Status: planning (Oracle `PLAN.oracle` in flight).

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
