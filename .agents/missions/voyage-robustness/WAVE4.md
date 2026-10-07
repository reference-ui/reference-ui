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

### 2026-10-08 — WAVE4.fix (P2-1 + P3-1 + P4-5) crew DONE

- Report: `reports/WAVE4.fix.md`.
- Touched: `packages/reference-lib/scripts/check-dist-fresh.mjs` only.
- **P2-1** sync leg made content-honest: instead of `newestSyncInput >
  baseSystem.mjs mtime` (which sticks red forever on any comment/whitespace/
  logic-only edit, because `commit.ts` preserves unchanged mtimes), the leg now
  asks "did a build consume the newest sync input?" — `newestSyncInput >
  newest dist output`. Every dist output is rewritten each build, so that is the
  last build time; sync runs inside `pnpm build`, so a build after the input
  makes `baseSystem.mjs` current by construction. No output is touched; no
  mtime bump in `commit.ts`.
- **P3-1** closes the upstream hole: `@reference-ui/icons/baseSystem` resolved
  via `import.meta.resolve` and tracked as a sync input (chose tracking over the
  drift-doc note).
- **P4-5** OK message reworded off the false "inputs predate outputs".
- Bars reproduced: comment-only edit → build → `check:dist` **FAIL persists**
  before / **OK** after (identical `baseSystem.mjs` bytes + mtime across two
  builds is the evidence); `ui.config.ts` content change with no build →
  FAIL naming `.reference-ui/system/baseSystem.mjs`; clean tree → OK; upstream
  icons baseSystem newer → FAIL naming the upstream, healed by a lib build.
- Gates: `pnpm agentneo q` **0 errors** (26 warnings); `check:dist` OK.
  `verify-pins` is **RED before and after this change, identically** — 3
  docs lines (`react/styles.css`, `styled/styles.css`, `system/baseSystem.mjs`)
  drifted by the live docs dev server / docs-release commits; this crew's lib
  script is outside the pinned set and adds **zero** pin delta. Baseline
  untouched; captain owns the docs re-baseline.
- Disclosed: two neo files modified by a parallel mission
  (`src/cli/watch.ts`, `src/sync/session-owner.ts`) were not touched; WAVE5's
  `dist/tasty/*` `REQUIRED_OUTPUTS` add still open (out of scope).
