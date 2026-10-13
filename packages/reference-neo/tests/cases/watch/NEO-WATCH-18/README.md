# NEO-WATCH-18 — a tasty warning raised by a save reaches the watch's resync line with its count

Evidence: the warm tasty refresh (`src/sync/tasty-phase.ts` runs one rebuild lane per source dir and reports each
landing the way the cold build does) and the watch runner (`src/cli/watch.ts` drains the latest landing into the
resync line). A one-shot `ref sync` of a tree with a dangling type import prints `Warnings: 1`, and the watch used to
drop the same warning on its resync line.

The runner syncs this world fresh, then the spec starts the real `ref sync --watch` CLI as a child process and reads the
lines it prints. The spec saves `theme/dangling.ts`, which imports a type that does not exist, and the first resync
line after that save must count the warning: its summary reads `1 warning`. The file is removed, the watch stops on
SIGINT, and the world restores in a `finally`, so the tree is byte-clean for the next run.

> Search terms: warm tasty refresh, save-time warning, resync line, warnings count, folded warning, dangling type import,
> missing type, tasty landing, watch warnings, one-shot parity, NEO-WATCH-08, NEO-WATCH-18
