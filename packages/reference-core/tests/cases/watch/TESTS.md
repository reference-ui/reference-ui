# WATCH ledger

Case ledger for the watch group. Claims and their proofs live in `SPEC.md`
(LC-nn). Statuses follow the SYNC ledger: `done` means the case folder has
in place with its README and spec; `in-progress` means planned or being written,
not yet committed; `open` means no case or test proves the claim.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CORE-WATCH-01 | live-edit→paint loop: a watch resync repaints the browser | done | none | browser | `specs/watch-loop.spec.ts`: css edit, token-value edit, fragment add, fragment delete | — |
| CORE-WATCH-02 | symlinked project root: watch and engine agree on the compiled file set | done | ATM-SCAN-01 | node | `specs/symlink-root.spec.ts` | SPEC LC-30 |
| CORE-WATCH-03 | directory move into and out of include: one resync with the engine's file set | done | ATM-SCAN-01 | node | `specs/dir-move.spec.ts` | SPEC LC-32 |
| CORE-WATCH-04 | symlinked source target edit: watch and engine agree on the target's bytes | done | ATM-SCAN-01 | node | `specs/symlink-target.spec.ts` | SPEC LC-30, note 3 |
| CORE-WATCH-05 | gitignored include: watch and engine agree on the file set | done | ATM-SCAN-01 | node | `specs/gitignored.spec.ts` | SPEC LC-31, note 1 |
| CORE-WATCH-06 | dotfile include: watch and engine agree on the file set | done | ATM-SCAN-01 | node | `specs/dotfile.spec.ts` | SPEC LC-31, note 2 |
| CORE-WATCH-07 | lock re-assert: deleting `.reference-ui` under a live watch re-asserts `sync.lock` | done | none | node | `specs/lock-reassert.spec.ts` | SPEC LC-21 |
| CORE-WATCH-08 | a watch resync whose types build fails reports the failure, then recovers on the next good save | done | none | node | `specs/types-failure.spec.ts` | SPEC LC-39 |
| CORE-WATCH-09 | concurrent one-shots end in exit 0 or 75, never by a signal or exit 1; the last sync wins | done | none | node | `specs/five-way-contention.spec.ts`: five held one-shots, four rounds | SPEC LC-49, LC-50 |
| CORE-WATCH-10 | a lock whose pid was recycled to an unrelated process is stale: never signalled, attached to or obeyed | done | none | node | `specs/recycled-pid.spec.ts` | SPEC LC-51 |
| CORE-WATCH-11 | a one-shot covered by a resident watch exits 0 only after the watch's output reflects the saved edit | done | none | node | `specs/covered-waits.spec.ts` | SPEC LC-52 |
| CORE-WATCH-12 | a one-shot that meets a stopping watch syncs for itself; an edit saved during the stop is never lost | done | none | node | `specs/stopping-edit.spec.ts` | SPEC LC-53 |
| CORE-WATCH-13 | a fix to a fragment that failed in a newly included dir resyncs the watch | done | none | node | `specs/extra-fragment.spec.ts` | SPEC LC-55 |
| CORE-WATCH-14 | a save whose event batch the OS drops still reaches the output through a watch re-scan | done | none | node | `specs/dropped-events.spec.ts`, loader hook under `specs/shim/` | SPEC LC-33 |
| CORE-WATCH-15 | an edit that lands while the watch boots is in its boot sync or resynced after it | done | none | node | `specs/boot-edit.spec.ts`, loader hook under `specs/shim/` | SPEC LC-56 |
| CORE-WATCH-16 | a wedged watch sync reports stuck on the next save; SIGINT exits within the shutdown bound with the lock released | done | none | node | `specs/wedged-sync.spec.ts` | SPEC LC-58 |
| CORE-WATCH-17 | a failed resync under --json prints one stdout diagnostics array that holds its failure | done | none | node | `specs/json-failure.spec.ts` | SPEC LC-61 |
| CORE-WATCH-18 | a tasty warning raised by a save reaches the watch's resync line with its count | done | none | node | `specs/warm-warning.spec.ts` | SPEC LC-59 |
| CORE-WATCH-19 | a commit that fails partway puts back every live file it replaced; the folder is byte-identical | done | none | node | `specs/commit-failure-rollback.spec.ts` | SPEC LC-46 |
| CORE-WATCH-20 | --break-lock over a sync frozen mid-commit: breaker exits 0, folder equals a clean rebuild, displaced holder fails cleanly | done | none | node | `specs/break-lock-mid-commit.spec.ts` | SPEC LC-48 |
| CORE-WATCH-21 | a generated directory replaced by a file heals on the next sync instead of failing with EEXIST on every run | done | none | node | `specs/dir-replaced-by-file.spec.ts` | SPEC LC-47 |
| CORE-WATCH-22 | a SIGTERM delivered mid-commit is honored: the commit finishes or rolls back, then the sync ends and releases its lock | done | none | node | `specs/sigterm-mid-commit.spec.ts` | SPEC LC-60 |
| CORE-WATCH-23 | an include glob that matches no files warns by name and the sync still exits 0, human and --json | done | none | node | `specs/include-matches-nothing.spec.ts` | SPEC LC-62 |
| CORE-WATCH-24 | a dangling symlink under include warns once by name, and the sync still builds CSS and types | done | none | node | `specs/dangling-link.spec.ts` | SPEC LC-63 |
| CORE-WATCH-25 | a new file inside a symlinked directory target resyncs the class the link serves | done | ATM-SCAN-01 | node | `specs/linked-dir-new-file.spec.ts` | SPEC LC-30 |
| CORE-WATCH-26 | five config loads that start together all resolve, so no one-shot loses its config to another's cleanup | done | none | node | `specs/config-load-race.spec.ts`: 150 rounds of five jittered loads of one world | SPEC LC-49; `config/evaluate.ts:createEvalDir` |
| CORE-WATCH-27 | a config dependency created after a failed config load resyncs the watch, and its include reaches the sheet | done | none | node | `specs/failed-load-dependency.spec.ts` | SPEC LC-26, LC-55 |
| CORE-WATCH-28 | a bare-specifier upstream that re-syncs through node_modules resyncs the downstream watch, linked or installed | done | none | node | `specs/bare-upstream.spec.ts`: a linked and an installed upstream, each re-synced alone | SPEC LC-28 |
| CORE-WATCH-29 | a config whose top-level await never settles exits a one-shot 1 with a named evaluation-timeout line, and a watch reports it and keeps watching until the config is fixed | done | none | node | `specs/config-timeout.spec.ts`: a one-shot CLI leg and a watch leg | SPEC LC-07 |
| CORE-WATCH-30 | a watch whose include mixes an unrooted glob with a path outside the project root resyncs on an edit under that outside path | done | none | node | `specs/outside-root-edit.spec.ts`: an edit to `../shared/colors.tsx` beside the world resyncs the sheet | SPEC LC-64 |
| CORE-WATCH-31 | a watch whose include lists exact file paths boots and resyncs on an edit to one of them | done | none | node | `specs/exact-file-include.spec.ts`: an include of `theme/base.ts` and `theme/tokens.ts` boots the watch, and an edit to `theme/base.ts` resyncs the sheet | SPEC LC-65 |

A row lands with its case folder.

## Notes

- Unit proofs cited by SPEC.md were run at SPEC time, one file per run. All
  passed: `lib/watch/scheduler.test.ts` (8), `sync/session.test.ts` (17),
  `sync/session-repro.test.ts` (16), `sync/commit-preserve.test.ts` (2),
  `sync/commit-live-reader.test.ts` (1), `sync/commit-repro.test.ts` (2),
  `sync/tasty-refresh.test.ts` (4), `sync/tasty-cold-follow-up.test.ts` (4),
  `sync/clean.test.ts` (6), `sync/clean-repro.test.ts` (2),
  `sync/sync-diagnostics.test.ts` (10). That is 72 tests in 11 files.
- Unit proofs added after that run (`lib/watch/{handler,handshake,scope,index,lock}.test.ts`,
  `sync/{session-hold,session-covered,session-covered-repro,session-identity,commit-rollback,include-check,tasty-phase-landing,tasty-refresh-failure}.test.ts`,
  `cli/output-watch.test.ts`) were checked by test name against the source. They were not re-run for this ledger.
- CORE-WATCH-09 to 23 were passing when this ledger was written. They were not re-executed here, because a case run rewrites tracked world output.
- Doc drift for the owners of those READMEs: CORE-CLI-02 cites `bin/core.test.ts`,
  but the file is `bin/ref.test.ts`. CORE-WATCH-01 still calls itself the one
  coverage home for watch behaviour. This group now holds the lifecycle claims.
- Debounce is credited to CORE-SYNC-14 by the CORE-WATCH-01 and CORE-CLI-02 READMEs,
  but its specs have no debounce leg. The proof is unit-level, `lib/watch/scheduler.test.ts`.
- CORE-WATCH-26 stress (real processes, the command behind LC-49): 25 rounds of five concurrent
  `node packages/reference-core/bin/ref.ts sync "$W"` runs on one fresh world, each run exiting 0 or 75.
  Result after the fix: 125 runs, 0 failures. The same spec fails on the HEAD sources at round 101 of 150 with
  `mkdtemp ... ENOENT`.
- CORE-WATCH-29's bound is 30 s (`CONFIG_EVALUATION_TIMEOUT_MS`, `src/config/evaluate.ts`). CORE-WATCH-16's wedge is a
  config that never settles, and its shutdown window runs about 10 s, so the bound must stay past that window. The
  bound covers config evaluation only: a fragment or tasty pass that never settles is still bounded by LC-58's stuck
  line and SIGINT exit alone.
