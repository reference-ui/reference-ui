# WAVE4 — micro-batch B4 + B5 + B6

STATUS: LANDED (`5b421e4ec`) — Oracle arc review in flight; one gap filed

B4: `check:dist` covers baseSystem; smoke asserts fragment shape.
B5: barrel guard follows config helpers transitively.
B6: Windows-tolerant upstream marker.
Bars in `GATES.md`; no pin change expected.

## Entries

### 2026-10-08 — B4 + B5 + B6 micro-batch DONE

- Report: `reports/WAVE4.micros.md`.
- Touched: `check-dist-fresh.mjs` (baseSystem outputs required + fresh),
  `consumer-smoke/run.mjs` (step 3b `requireFragment` shape),
  `base-system-import.test.ts` (transitive relative-import walk + cycle guard),
  `errors.ts` + `errors.test.ts` (Windows-tolerant `UPSTREAM_MARKER`).
- B4 refinement: sync outputs are compared against sync inputs (config + src +
  book), not packaging inputs, because `sync/commit.ts` preserves mtime for
  unchanged bytes and `baseSystem.d.mts` is content-invariant — a unified mtime
  check could never go green.
- Bars reproduced: token touch → `check:dist` FAIL names
  `.reference-ui/system/baseSystem.mjs`; dataless fixture → smoke FAIL at step 3b;
  tmp-project config+helper→barrel FAILS the guard while all in-repo configs
  pass; Win32 message gets the hint with the 4 existing tests green.
- Gates: `pnpm agentneo q` **0 errors** (24 pre-existing warnings); neo config
  vitest **31/31**; `verify-pins` **PASS** (1258 files, no pin change);
  `check:dist` OK. One lib build (documented, package cwd, icons build skipped)
  resolved the B-11 procedure gap.
- Out-of-scope finding (not repaired): full consumer smoke mount probe 404s on
  the packaged `./tasty/runtime.js` dynamic import (pre-existing packaging gap,
  unrelated to B4/B5/B6); step 3b and every prior smoke step pass.
- **Captain verification.** Re-ran the gates: `agentneo q` 0 errors; neo
  `src/config` vitest 31/31; `check:dist` OK; `verify-pins` PASS (1258, no pin);
  B5 fixture FAILS at `b.ts`; B6 Win32 test green. Committed `5b421e4ec`.
  Filed the tasty gap as `docs/bugs/LIB_TASTY_RUNTIME_404.md` with the exact
  cause (`dist/index.mjs` lazy-imports `./tasty/runtime.js`;
  `materialize-runtime.mjs:13` copies only react/styled) and three fix options —
  escalated to the arc review for a scope ruling rather than fixed unilaterally.
