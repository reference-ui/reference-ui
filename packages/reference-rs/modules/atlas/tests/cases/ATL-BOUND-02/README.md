# ATL-BOUND-02 — a project analyzed through a symlinked root counts the same as through its real path

`input/app` is a small project: `src/components` exports one `Button`, and `src/pages/home.tsx` reaches it through
`../components`, a parent-relative import. The station analyzes the committed folder in process; its goldens are the
reference counts.

`spec.ts` copies `input/app` into a temp directory it owns, creates `link -> real` beside it, and analyzes both the
symlinked root and its real path through the built atlas dist in child processes under `runIsolated`. The two results
must carry the same components with the same counts, and the `Button` count must be the one the page gives.

Atlas resolved the parent-relative import through a canonical candidate while its module keys kept the spelling it was
given, so a root reached through a symlink (macOS `/var` is `/private/var`) missed its own modules and counted 0 where
the real spelling counts 1. The analysis root is now canonical from the start.

Siblings: ATL-BOUND-01 (a hostile shape analyzed in a child process), ATL-BOUND-02 is the root-spelling contract.

> Search terms: symlinked root, real path, canonical root, root spelling, parent-relative import, module keys, usage count, /var, /private/var
