# Root script helpers

The root dev router. Routes explicit targets to their stacks so appended CLI args never become stray concurrently commands; the default stays docs.

`dogfood-sync.mjs` (`pnpm dogfood`) rebuilds the shipped `ref` CLI, then syncs reference-icons, reference-lib, reference-docs and reference-lib/book, in that order, each in an isolated copy under the OS temp dir. The copies mirror the repo's layout, so workspace links resolve to the copies, and docs' content-collections build runs in its copy before its sync. No watch session can answer for a copy; a watch owner, a signal, a timeout, a non-zero exit or a git-status change in the repo fails the run. Flags: `--skip-build` reuses the built CLI; `--json` prints one result line on stdout (run `pnpm -s dogfood --json` so pnpm's own banner stays off stdout); `--keep` keeps the copies even on success (a failed run always keeps them and prints the path).

`copy-corpus.mjs` runs first in `pnpm bootstrap`. A git worktree has no docs corpus (`vendor/docs/_normalized` is gitignored), so memex's `docs-corpus` collection is empty there; this copies the main worktree's corpus in (an APFS clone on macOS, about 3 s). A symlink is not enough: memex skips roots that resolve outside the repo.
