# NEO-WATCH-20 — --break-lock over a sync frozen mid-commit leaves the breaker exit 0 and the folder equal to a clean rebuild, and the displaced holder fails cleanly

The spec plants stale generated files, so a commit stays busy while it retires them, then changes the brand. It
freezes a holder sync inside its commit with SIGSTOP, starts a breaker sync with `--break-lock`, and freezes the
breaker inside its own commit. It resumes the holder first: the holder sees the lock taken and stops before its next
write, with the lock message. Then it resumes the breaker, which must exit 0. The folder must equal a clean rebuild of
the same world. Before the fix, both syncs shared one stage dir, and each deleted the other's, leaving the folder torn.

> Search terms: break-lock, lock takeover, displaced holder, shared stage, ENOENT, torn folder, SIGSTOP, mid-commit, NEO-WATCH-20
