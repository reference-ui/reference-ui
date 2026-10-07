# Brief — WAVE4.micros (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 4 of the robustness voyage: the micro-batch **B4 + B5 + B6** (Oracle
`PLAN.oracle` / `DESIGN.oracle`). Read `reports/PLAN.oracle.md` (F-A…F-D,
backlog), `reports/CWD.oracle.md`, and `GATES.md`. Work in
`/Users/ryn/Developer/reference-ui`, branch `reference-system` (base: the
B3-depth land). Do not commit, push, or `git stash`; do not touch
`packages/reference-rs/**` or the pre-existing untracked `pipeline/` files;
do not edit the pin baseline. Disclose any file you did not touch.

## B4 — producer freshness directness (T2 remainder) + F-D

- `packages/reference-lib/scripts/check-dist-fresh.mjs:22-29`: add the two
  generated `baseSystem` outputs to `REQUIRED_OUTPUTS` so the `:20-21`
  "subsumption" claim is no longer load-bearing (it becomes direct).
- `packages/reference-lib/scripts/consumer-smoke/run.mjs` step 3b (`:90-102`):
  the probe asserts only `typeof baseSystem.name === 'string'`; also assert a
  `requireFragment`-shape payload (mirror `system/base/validate.ts:90`) so a
  dataless-but-named payload fails.
- Bars: a token touch without a sync → `check:dist` **FAIL** naming baseSystem;
  a dataless fixture → smoke **FAIL**.

## B5 — barrel guard follows config helpers (test-only, F-B)

- `packages/reference-neo/src/config/base-system-import.test.ts`: the guard
  currently walks only `ui.config` files. Extend the walk to follow **relative**
  imports from each config transitively (with a cycle guard), so a config whose
  helper imports the `@reference-ui/lib` barrel is caught. Keep the existing
  exact-barrel matcher. Optional: a barrel deny-alias in `config/bundle.ts`
  (safe today; zero in-repo violations) — only if it stays small and loud.
- Bar: a fixture tmp-project (`ui.config` + relative helper → barrel) **FAILS**
  the guard; every in-repo config still passes.

## B6 — Windows-tolerant upstream marker (F-C)

- `packages/reference-neo/src/config/errors.ts:69`: `UPSTREAM_MARKER` is
  `/\.reference-ui\//`; make it tolerate backslash separators
  (`/[\\/]\.reference-ui[\\/]/`). Add a Win32-shaped message test.
- Bar: a Win32-shaped `ERR_MODULE_NOT_FOUND` message gets the hint; the
  existing 4 marker tests stay green.

Note (out of scope): `normalizeConfigDependencyPaths` `:28` treats only
`/`-prefixed paths as absolute (same Win32 class) — note it, do not expand.

## Prove

- `pnpm agentneo q` 0 errors; neo config vitest + lib `check:dist` + consumer
  smoke green on the touched paths; `verify-pins` PASS (no pin change expected).
- Do **not** act on P4-1/P4-2/P4-5/P4-6 (advisory).

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE4.micros.md`, append to
`.agents/missions/voyage-robustness/WAVE4.md`, reply with a short summary +
VERDICT.