# WATCH ledger

Case ledger for the watch group. Claims and their proofs live in `SPEC.md`
(LC-nn). Statuses follow the SYNC ledger: `done` means the case folder has
landed with its README and spec; `in-progress` means planned or being written,
not yet committed; `open` means no case or test proves the claim.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-WATCH-01 | live-edit→paint loop: a watch resync repaints the browser | done | none | browser | `specs/watch-loop.spec.ts`: css edit, token-value edit, fragment add, fragment delete | `[core]` matrix/watch/tests/e2e/watch-contract.spec.ts; SPEC LC-29 |
| NEO-WATCH-02 | symlinked project root: watch and engine agree on the compiled file set | in-progress | ATM-SCAN-01 | node | planned, no folder yet | SPEC LC-30 |
| NEO-WATCH-03 | directory move into and out of include: one resync with the engine's file set | in-progress | ATM-SCAN-01 | node | planned, no folder yet | SPEC LC-32 |
| NEO-WATCH-04 | symlinked source target edit: watch and engine agree on the target's bytes | in-progress | ATM-SCAN-01 | node | planned, no folder yet | SPEC LC-30, note 3 |
| NEO-WATCH-05 | gitignored include: watch and engine agree on the file set | in-progress | ATM-SCAN-01 | node | planned, no folder yet | SPEC LC-31, note 1 |
| NEO-WATCH-06 | dotfile include: watch and engine agree on the file set | in-progress | ATM-SCAN-01 | node | planned, no folder yet | SPEC LC-31, note 2 |
| NEO-WATCH-07 | lock re-assert: deleting `.reference-ui` under a live watch re-asserts `sync.lock` | in-progress | none | node | planned, no folder yet; no `src` code yet | SPEC LC-21 |
| NEO-WATCH-08 | a watch resync whose types build fails reports the failure, then recovers on the next good save | in-progress | none | node | folder in the working tree, not yet committed | SPEC LC-39 |

NEO-WATCH-09 and up are reserved for the doom round. No rows until their folders land.

## Notes

- Unit proofs cited by SPEC.md were run at SPEC time, one file per run. All
  passed: `lib/watch/scheduler.test.ts` (8), `sync/session.test.ts` (17),
  `sync/session-repro.test.ts` (16), `sync/commit-preserve.test.ts` (2),
  `sync/commit-live-reader.test.ts` (1), `sync/commit-repro.test.ts` (2),
  `sync/tasty-refresh.test.ts` (4), `sync/tasty-cold-follow-up.test.ts` (4),
  `sync/clean.test.ts` (6), `sync/clean-repro.test.ts` (2),
  `sync/sync-diagnostics.test.ts` (10). That is 72 tests in 11 files.
- Case folders were not re-executed for this ledger. Running them rewrites
  tracked world output. Their statuses rest on the landed folders, READMEs and specs.
- Doc drift for the owners of those READMEs: NEO-CLI-02 cites `bin/neo.test.ts`,
  but the file is `bin/ref.test.ts`. NEO-WATCH-01 still calls itself the one
  coverage home for watch behaviour. This group now holds the lifecycle claims.
- Debounce is credited to NEO-SYNC-14 by the NEO-WATCH-01 and NEO-CLI-02 READMEs,
  but its specs have no debounce leg. The proof is unit-level, `lib/watch/scheduler.test.ts`.
