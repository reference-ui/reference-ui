# Mission: voyage-robustness — harden the config/emit/exports surfaces

Status: planning (Oracle `PLAN.oracle` in flight).

Objective: make the one-shot `ref sync` / config-load / emission path robust —
deterministic bytes, no silent staleness, and proof machinery that cannot pass
vacuously. This follows `voyage-one-shot` (one-shot ~1.9 s → ~300 ms), whose
land exposed exactly these weaknesses.

## Candidate backlog (from filed follow-ups + accepted arc risks)

| id | topic | source | surface |
| --- | --- | --- | --- |
| **T1** | Emit-mode determinism: source- vs dist-invoked neo changes fragment-bundle bytes (esbuild `// path` banners) | `docs/bugs/NEO_EMIT_MODE_DRIFT.md` (W1-1) | `lib/microbundle/build-options.ts` (+ `collect/lib/bootstrap.ts`) |
| **T2** | Silent stale upstream: the `./baseSystem` subpath reads lib's live `.reference-ui`; the hint covers **missing**, not **stale** | `reports/WAVE1.arc.md` W1-9 | `config/load.ts`, `config/errors.ts` |
| **T3** | Proof-harness hardening: `verify-pins` staleness guard + dist-provenance attestation (deferred) | `GATES.md` (superseded note), `reports/WAVE0.oracle.md` W0-2/W0-3 | `.agents/missions/**/scripts` |
| **T4** | Survey: other robustness gaps on config-load, exports, and the guard the Oracle flags | this plan | survey |

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
