# NEO-WATCH-22 — a SIGTERM delivered mid-commit is honored: the commit finishes or rolls back, then the sync ends by the signal and releases its lock

The spec changes the brand, then starts a sync armed with the commit's test-only pause point (`REF_TEST_COMMIT_PAUSE`,
`src/sync/commit-pause.ts`): once the sync's live changes have been applied, the commit writes a marker and blocks until the
spec resumes it. The spec checks the live sheet already carries the new brand, so the signal lands with live changes
made. While the sync is held there the spec sends it a SIGTERM, then resumes it. The commit is synchronous, so the
signal is only seen after the commit returns, and the stop handler must still be installed then. The sync must end by
SIGTERM (or a non-zero exit), release its lock, and leave the folder either as the new state or as the last-good one.
Before the fix, the sync released its lock, and removed its handler, before the queued signal was read, so the signal
was dropped and the sync exited 0.

> Search terms: SIGTERM, signal swallowed, mid-commit, stop handler, release lock, queued signal, exit 0, commit pause hook, REF_TEST_COMMIT_PAUSE, NEO-WATCH-22
