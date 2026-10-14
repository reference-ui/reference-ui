# NEO-WATCH-20 — --break-lock over a sync frozen mid-commit leaves the breaker exit 0 and the folder equal to a clean rebuild, and the displaced holder fails cleanly

The spec plants a few stale generated files, which a commit retires last, then changes the brand. It starts a holder
sync armed with the commit's test-only pause point (`REF_TEST_COMMIT_PAUSE`, `src/sync/commit-pause.ts`): once the
holder's live changes have landed, and before it retires anything, the commit writes a marker and blocks until the spec
resumes it, so the spec acts at that exact point and not on a timer. With the holder held, it starts a breaker sync with
`--break-lock`, which takes the lock and is held at its own pause point. It resumes the holder first: the holder goes on
into its retire pass, sees the lock taken and stops before its next write, with the lock message. Then it resumes the
breaker, which must exit 0. The folder must equal a clean rebuild of the same world. Before the fix, both syncs shared
one stage dir, and each deleted the other's, leaving the folder torn.

> Search terms: break-lock, lock takeover, displaced holder, shared stage, ENOENT, torn folder, commit pause hook, REF_TEST_COMMIT_PAUSE, mid-commit, NEO-WATCH-20
