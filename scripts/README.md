# Root script helpers

The root dev router. Routes explicit targets to their stacks so appended CLI args never become stray concurrently commands; the default stays docs.

`dogfood-sync.mjs` (`pnpm dogfood`) rebuilds the shipped `ref` CLI, then runs `ref sync` in reference-icons, reference-lib, reference-docs and reference-lib/book, in that order, and fails on any signal, timeout, non-zero exit or git-status change the run caused. Flags: `--skip-build` reuses the built CLI; `--json` prints one result line on stdout (run `pnpm -s dogfood --json` so pnpm's own banner stays off stdout).
