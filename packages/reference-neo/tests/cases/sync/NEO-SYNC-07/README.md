# NEO-SYNC-07 — stale files from a previous sync are removed

Evidence: `[core]` clean behaviour (`packages/reference-core/src/clean/command.ts` removes the output dir recursive-force before regenerating).

The runner syncs this world fresh, then the spec plants yesterday's
leftovers — a top-level junk file, a stale module inside `system/`, and a
nested junk dir — syncs again, and asserts every planted path is gone while
the regenerated inventory is intact. Sync cleans with the same recursive
`rm` core uses, so a renamed or deleted output can never haunt the folder.

> Search terms: orphan-files, rm-rf, prune, tidy, orphan sweep, clean slate, sync/stale-cleanup, sync/clean-resync, NEO-SYNC-02
