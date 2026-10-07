# Mission: voyage-one-shot — `ref sync` startup performance

Status: planning (Oracle consult `PLAN.oracle` in flight).

Objective: cut the one-shot `ref sync` startup cost on the docs app. The
measured headroom is concentrated in **config load** (`loadUserConfig`,
~1.6 s of a ~1.7 s atomic sync); native compile is ~45 ms and tasty ~0.12 s.
See `docs/bugs/ONE_SHOT_STARTUP.md` (committed `7c4847f01`).

## Doctrine (agent-perf, adapted to the TS/startup surface)

- **Fresh flames first** each wave: reproduce on the current tip before
  scoping; stale numbers seed stale diets.
- **Counts-first falsification**: every route must name the counted work it
  removes and the bar that would falsify it. Fast CUT is first-class.
- **Byte-identity**: the emitted system (manifest + CSS) must be identical to
  the current load. Prove it, do not assert it.
- **Verdicts**: LAND / BANK / CUT / HOLD, with the mechanism proof.
- **One working tree, one shared native `.node`**: implementers serialize;
  Oracle reviews and fix lines overlap the next wave. Bench-lock any timed
  block (`/tmp/swarm-bench-lock`), release in two steps.
- **Crews never commit**; the captain re-runs the decisive gates and commits,
  one verified arc per commit, with a re-measure of the phase split.
- **Oracle per wave**: architecture/route review at plan time (done here) and
  an arc review per landed change; a fix line answers its wants/demands.

## Measurement harness

`.agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs`:
- atomic sub-phases via `REFERENCE_UI_PHASES_OUT` (config/scan/evaluate/
  compile/publish/residual),
- the tasty drain,
- `loadUserConfig` split into esbuild-bundle vs `evaluateConfig`,
- isolated `import('@reference-ui/neo')` vs `import('@reference-ui/lib')`.

```bash
node .agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs packages/reference-docs
```

## Waves

(To be set from `PLAN.oracle`. Placeholder order, subject to the Oracle's
ranking and the first-land recommendation.)

- **Wave 0** — repro + baseline: phase split at tip, two runs, sha the dist
  used; seed the perf index (`index: 0/N, built <date>`).
- **Wave 1** — best first land per Oracle.
- **Wave 2** — second route (or next-ranked if wave 1 is a CUT).
- **Wave 3** — integration + re-profile + closeout.

## Logs

`.agents/missions/voyage-one-shot/` — `WAVE.md` per wave, `briefs/`,
`reports/` (gitignored). Perf artifacts (patches, bench reports) under
`docs/PERF/waves/one-shot-startup/`.
