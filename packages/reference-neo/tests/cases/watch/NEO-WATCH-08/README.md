# NEO-WATCH-08 — a watch resync whose types build fails reports the failure, then recovers on the next good save

Evidence: `[neo]` watch resync (`src/cli/watch.ts` prints one line per resync, and a failed types build takes that line)
and the warm tasty refresh (`src/sync/tasty-phase.ts` runs one rebuild lane per source dir, and its failure stays
reported until a run lands). A source under `include` that is not valid UTF-8 fails the tasty scan (tasty reads each
discovered file as UTF-8, and the first read error fails the whole build), while the CSS side reads the same file
lossily and syncs clean. A dangling symlink no longer fails the scan (NEO-WATCH-24), so it cannot drive this case.

The runner syncs this world fresh, then the spec starts the real `ref sync --watch` CLI as a child process and reads
the lines it prints. A non-UTF-8 `theme/broken.ts` breaks the types build: the first resync that file causes must
print the tasty failure on its own line, never the success one-liner. The old code printed success there and surfaced
the failure only as a background `[neo]` line. Then the file goes, a good `theme/newtype.ts` exporting `NewThing` is
saved, and a later resync prints success once the type has landed in `.reference-ui/types`. The watch stops and the
world restores in a `finally`, so the tree is byte-clean for the next run even when an assertion fails.

> Search terms: watch resync, types build failure, tasty refresh failed, invalid UTF-8, non-UTF-8 source, watch error line, resync success line, warm refresh lane, recovers on the next save, NEO-REF-04, NEO-SYNC-14, NEO-WATCH-01, NEO-WATCH-24
