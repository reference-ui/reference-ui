# ATM-SCAN-03 — a file reached only through a link that closes a loop compiles under that link's path

`input/` is a plain two-file tree: `src/x.ts` sets `red.500` and `src/a/y.ts` sets `blue.500`. The default compile reads both, and that stylesheet is the reference in the committed golden output.

`spec.ts` copies `input/` into a temp project it owns, adds the loop link `src/a/up -> ..`, which points back at `src`, and compiles that project with the include `src/a/**/*.ts`. `src/x.ts` is outside that include by its real path, so its only in-scope path is `src/a/up/x.ts`. The red utility must compile from that alias, and its want must carry the alias path. A walk that cut every link back to a directory already on its path would list `src/a/y.ts` alone and lose `red.500`. The parent removes the temp project.

Siblings: ATM-SCAN-01 (include scoping over the disk scan), ATM-SCAN-02 (discovery scoping), ATM-BOUND-04 (two self-links, bounded in a child process).

> Search terms: symlink loop, loop link, include scope, alias path, link alias, source walk, scan_dir, visited directory state, want file, disk scan
