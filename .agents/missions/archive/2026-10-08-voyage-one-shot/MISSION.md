# Mission: voyage-one-shot — `ref sync` startup performance

Status: COMPLETE — see `CLOSEOUT.md` (R1 landed; one-shot ~1.9s → ~295ms).

Objective: cut the one-shot `ref sync` startup cost on the docs app. The
measured headroom is concentrated in **config load** (`loadUserConfig`,
~1.6 s of a ~1.7 s atomic sync); native compile is ~45 ms and tasty ~0.12 s.
See `docs/bugs/ONE_SHOT_STARTUP.md` (committed `7c4847f01`).

## Oracle plan (PLAN.oracle, pin `7c4847f01`)

The ~1.5 s is the `@reference-ui/lib` barrel ESM graph; the dominant share is
the **icons fan-out** (~3,858 generated modules, ~7.7k file loads) inside the
barrel, not the 4.1 MB barrel parse. Zero Rust. Findings confirmed V1–V8.

- **Wave 1 first land — R1:** add `@reference-ui/lib` `exports["./baseSystem"]`
  (types + import) to reach the already-shipped, zero-import
  `.reference-ui/system/baseSystem.{mjs,d.mts}`; migrate the 3 configs that
  import the barrel for `baseSystem` (`reference-docs`, `matrix/tests/mcp`,
  `matrix/tests/chain/T16`). Precedents: `@reference-ui/icons` `./baseSystem`,
  matrix `@fixtures/extend-library/baseSystem`, and lib's own `ui.config.ts`.
  Expected ~1.6 s → ~10–30 ms; **byte-identical** (same JSON value, different
  module instance). R1 also carries a barrel-import guard test, a
  `LoadConfigError` hint for missing upstream modules, and a packed-tarball
  subpath smoke.
- **R2** (alias-force lib into the config bundle) is the **CUT-backup only**
  — R1 landing evaporates its prize. Not a follow-up.
- **R4** (cross-process evaluated-config cache) is **gated**: proceed only if
  the residual config phase after R1 still clears the ≥15 ms LAND bar; its
  invalidation key needs an Oracle design consult first (`dependencyPaths`
  filters `node_modules`, so a naive key is unsound).
- **CUT now on mechanism:** R5 (cheaper eval), R7 (lazy `extends`).
  **Parked:** R6 (split icons out of barrel — needs a compat ruling), R8
  (daemon — HQ call), R9/R10 (micro / published-bytes).

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
- **Oracle per wave**: plan review (done); **harness/census review after
  Wave 0**; **arc review after R1 lands**; **design consult before any R4**.

## Measurement harness

`.agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs`:

```bash
node .agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs sync packages/reference-docs
node .agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs config packages/reference-docs
```

## Waves

- **Wave 0 (current)** — recon: harness, module-load census (~7.7k → ~2
  expected), byte-identity pins (docs + lib self-sync + icons self-sync),
  `MEASURE.md`. Oracle harness review.
- **Wave 1** — R1 implementor; parallel read-only R2 census/design. Oracle
  arc review + fix line.
- **Wave 2** — R4 only if residual clears the bar (likely CUT by
  evaporation); R2 only if R1 CUTs.

## Logs

`.agents/missions/voyage-one-shot/` — `WAVE.md`, `MEASURE.md`, `briefs/`,
`reports/` (gitignored). Perf artifacts under `docs/PERF/waves/one-shot-startup/`.
