# Chain verdict: Neo TS cluster (night 2026-09-24)

Oracle: chain oracle neo. Re-verified the entire fortify arc firsthand;
nothing taken on word. Read-only on source throughout (no stash, revert,
or edit — concurrent crews flying); fail-without-fix stands on the
evidence chain (pins mirror the blind repros witnessed red by hunter +
rule oracle). Case-runner artifacts under `tests/.artifacts/` are
runner-owned, not oracle writes.

**Verdict: VERIFIED — commit-ready.**

## 1. Blind repros (exact commands, unmodified, repo root)

| Repro | Result |
|---|---|
| `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-r1-neo-red.mjs` | exit 0 — `GREEN: throw names every stable error code`; throw reads `- ATM-E-UNKNOWN-TOKEN: unknown token reference …` |
| `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-g1-frag-red.mjs` | exit 0 — both legs PASS; statement `@layer \@scope\/pkg, app;` and `@layer a\,b, app;` match their blocks |
| `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-g1-sync-watch-include.mjs` | exit 0 — config-widen resync observed, `onChange=true resync=true` for `extra/new.ts`, sheet has ink fill, world removed |

## 2. Fortify diff attribution (by content; `git diff` + `git status --short`)

### Fortify-neo's work (in-boundary, all three breaks)

- A: `src/diagnostics/report.ts:19-29` — `errorCodeSegment` + coded throw
  (`- CODE: message (loc)`, mirroring `formatVerboseWarningLine`);
  header comment `:8` gains the code mention (same file, same hunk
  neighborhood — allowed). `src/diagnostics/README.md:21` — "Errors throw
  with their codes and locations" (coupled verbatim update — allowed;
  file is untracked/campaign-new, attribution by mtime + content match).
- A pin: `src/diagnostics/report.test.ts` (new) — real bad-token world
  through real `compileWorld` + `throwOnErrorDiagnostics`, asserts every
  minted code rides the throw; plus a codeless-entry degrade case
  asserting no `undefined` segment. Non-tautological; mirrors the repro.
- B: `src/system/base/streams.ts:107-113` — statement names map through
  the existing `escapeSelector` (defined `:61`, block path `:74`) at
  print time, after the raw-keyed dedupe (`seen` still keys
  `entry.name`; field stays `entry.name`). One call-site hunk.
- B pins: `src/system/base/streams.test.ts` new `mergeStreams statement
  escaping` describe — scoped (`@scope/pkg`) and comma (`a,b`) upstream
  + own, asserting statement and portable statement equal the escaped
  layers the blocks define. Entries are engine-realistic
  (name == package with the special chars).
- C: `src/lib/watch/index.ts` — `diffWatchRoots` helper, `TriggerScope`
  handle, `refreshTriggerScope` (rebuilds `state.isMatch`,
  `state.dependencyFiles`, diffs roots) called inside the existing
  serial resync closure after `sync()` and before `onResync`;
  subscriptions become a root-keyed `Map`; `stop()` iterates values.
- C must-move-together: `src/config/load.ts` — `lastLoadedByRoot` cache
  written on successful load only (failed loads record nothing) +
  `getLastLoadedUserConfig`. Compile and trigger consume the same load
  object, never two; no double-load.
- C pin: `tests/cases/sync/NEO-SYNC-14/specs/watch-include.spec.ts`
  (new) — narrow baseline, watch, widen (setup proof: widen resync
  observed), add under the new glob, assert change + resync + sheet
  convergence with a one-shot control run first (green control pairs
  any red leg); narrowing leg asserts removed globs stop waking and
  resyncing. Byte-restores the world in `finally`.

### Foreign / pre-existing hunks (itemized, NOT absorbed)

- `src/diagnostics/registry.test.ts` (new, untracked) — fortify-trivial's
  RS-registry self-check (reads RS code tables). Ran green (1 test) but
  out of this verdict's scope.
- `src/native/diagnostics.ts` — campaign extraction to a pure re-export
  compat layer. Verified: zero logic, re-exports only (ruling's
  must-not-gain-logic holds).
- `src/sync/sync-diagnostics.test.ts`, `NEO-SYNC-16/specs/compiler.spec.ts`
  — campaign fold-into-count UX changes (ruling noted the uncommitted
  campaign mods; fortify diffs against HEAD, not the worktree).
- `src/sync/session.ts` — campaign `--json` lock-notice threading.
- `src/native/contract.ts`, `src/reference/**`, `tsconfig.json`,
  `PLAN.md`, benchmark reports, `NEO-CLI-02/case.json` + world
  `alpha.ts`/`beta.ts`, `tools/vendor-*.mjs`,
  `src/native/generated/**`, `tests/cases/diag/**`,
  `packages/reference-rs/**` — campaign work / other flying crews.

## 3. Boundary check (line-by-line vs the ruling)

- A — throw format + codeless degrade only: yes (`report.ts:19-29`;
  `undefined` impossible by construction). README iff verbatim: yes
  (`README.md:21` describes the throw shape). No CLI-catch/JSON
  changes: `src/cli/` byte-clean; `reportedSyncEntries`
  (`report.ts:89-97`) still warnings + compiler only; `native compile
  failed` occurs only in `report.ts`; failure lines still
  `messageOf(err)` (`sync.ts:70`, watch equivalent).
- B — escape at print time: yes (post-dedupe `.map`). Dedupe key stays
  raw: yes (`seen.add(entry.name)`). Field stays `entry.name`: yes.
  Corpus untouched: `streams-corpus.ts` byte-clean. `validate.ts`,
  `sync/index.ts` merge call site, `wrapPackageLayer`/`escapeSelector`
  untouched: confirmed clean / byte-identical.
- C — scope rebuild on the resync path from the same config load: yes
  (`refreshTriggerScope` reads the cache the compile's load wrote).
  Subscriptions churn only on root change: yes (`diffWatchRoots`,
  add/remove only; unchanged set churns nothing). Debounce/poke/lock
  untouched: `createResyncScheduler`, trailing-edge, poke-drain,
  SIGUSR2 wiring, `getIgnoreGlobs`/`STATIC_IGNORE`, subscribe options
  all byte-identical; rebuild rides inside the serial resync.
  Foreign-cwd untouched: `bundle.ts` byte-clean.
  `deriveWatchRoots` semantics pinned: function byte-identical.
- Committed CLI contract byte-identical throughout: boot block, failure
  lines, `--json` failure shape — `src/cli/` clean; `output.test.ts`
  (35 tests, incl. boot-block pins) green.

## 4. Suites firsthand

- `src/diagnostics/`: 7 files, 101 tests, all pass (incl. new
  `report.test.ts` pin A ×2, foreign `registry.test.ts` ×1).
- `sync-diagnostics.test.ts` (8), `cli/output.test.ts` (35),
  `streams.test.ts` (25, incl. pin B ×2), `streams-goldens.test.ts`
  (13, byte-identical), `config/validate.test.ts` (12): 93 tests, pass.
- Digit-lead check: `2xl-lib` leads with a digit but is confined to the
  no-upstream path (`streams.test.ts:311`, no statement emitted);
  `SCOPED_ENTRY` likewise except the new pin-B leg; all goldens are
  no-upstream. Escape is a fixed point on every statement-path corpus
  name.
- Cases: NEO-SYNC-14 (PASS `watch-include.spec.ts` pin C +
  `watch.spec.ts`), NEO-WATCH-01, NEO-CLI-02, NEO-SYNC-06, NEO-SYNC-15,
  NEO-CLI-01, NEO-MERGE-01..08, NEO-LAYER-01..06 — all PASS.
  (NEO-LAYER-04's `TST-E-SCAN-FAILED:` line is expected spec output
  inside a PASS, and shows the coded throw working through the channel.)
- Gate: `pnpm agentneo q` over all 8 touched files — 0 errors,
  2 non-failing warns (`watch/index.ts` file length 432 > 365 warn,
  `watchSync` cyclomatic 9 > 8 warn).

## 5. Gaps

None. All three breaks closed within their ruled boundaries, pins assert
the fixed behavior and run green, sweeps green, gate green.
