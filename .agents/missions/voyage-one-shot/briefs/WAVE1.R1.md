# Brief — WAVE1.R1 (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 1 of the one-shot startup voyage: land **R1** — a `@reference-ui/lib`
`./baseSystem` export subpath. Read `MISSION.md`, `MEASURE.md`, and the Oracle
plan `reports/PLAN.oracle.md`. Work in `/Users/ryn/Developer/reference-ui`,
branch `reference-system` (base `29e3e4d3e`). Do not commit, push, or
`git stash`. Bench-lock timed blocks (`/tmp/swarm-bench-lock`). Disclose any
file you did not touch. Pre-existing untracked `pipeline/` files are not yours.

## What to implement

1. **`packages/reference-lib/package.json`** — add `exports["./baseSystem"]`
   with `types` + `import` conditions pointing at the already-shipped
   `.reference-ui/system/baseSystem.d.mts` / `baseSystem.mjs` (confirm exact
   paths against the package `files`; use the `./baseSystem` name the Oracle
   fixed, matching `@reference-ui/icons`). Both conditions are required or
   publint/attw-class checks complain.
2. **Migrate the 3 configs** that import the lib barrel for `baseSystem`:
   `packages/reference-docs/ui.config.ts`, `matrix/tests/mcp` config, and
   `matrix/tests/chain/T16/ui.config.ts` → `import { baseSystem } from
   '@reference-ui/lib/baseSystem'`. Confirm the set by grepping in-repo
   `ui.config` files for a `baseSystem` import from `@reference-ui/lib`; if the
   Oracle's list is off, fix the real set and say so.
3. **Guard test** — assert no in-repo `ui.config` imports `baseSystem` from the
   barrel (so authors cannot silently re-pay the 1.5 s). Put it where the repo
   already runs such checks; keep it fast and structural.
4. **`LoadConfigError` hint** — when config evaluation fails with a missing
   upstream module, append a "run sync on the upstream package first" hint,
   mirroring `packages/reference-neo/src/system/base/validate.ts:91`
   (`config/errors.ts:64` is the seat).
5. **Consumer smoke** — assert the subpath actually resolves (types condition
   included) from a packed tarball, i.e. the packaged `files` + `exports` agree.

## Prove (bars)

- **Counts:** rerun the census (`scripts/census/run.mjs`) → config-import loads
  collapse **7,728 → ~2**.
- **Timing:** `scripts/measure-one-shot.mjs sync packages/reference-docs`, 8
  fresh-process pairs, warmups unscored → config phase **1548 ms → ~10–30 ms**
  (LAND bar: ≥15 ms and ≥1.5% of whole sync; expect ~100×).
- **Byte-identity:** `node scripts/verify-pins.mjs` must still PASS
  (docs+lib+icons). If R1 legitimately cannot keep a pin, stop and report why
  before proceeding.
- **Suites on the exact tree:** the config-touching paths — `pnpm agentneo q`,
  the matrix config fixtures that moved (`mcp`, `chain/T16`) via the repo
  runner, lib's package/smoke/`check-dist-fresh` as available. Record exact
  commands + results; the captain re-runs the decisive ones.
- **No `#[allow]`/suppressions; Neo gate clean.**

## Also (read-only, for insurance)

Append a short **R2 design note** to your report: if R1 were CUT, what
alias-forcing `@reference-ui/lib` into the config bundle would take (entry
point, expected bundle-vs-eval split with the same harness). Do not implement
R2.

## Output

Write `.agents/missions/voyage-one-shot/reports/WAVE1.R1.md` (counts before/
after, timing table, identity result, suites, R2 note), append to
`.agents/missions/voyage-one-shot/WAVE1.md`, and reply with a short summary +
VERDICT (LAND / CUT / HOLD).