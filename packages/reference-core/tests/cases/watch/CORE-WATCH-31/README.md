# CORE-WATCH-31 — a watch whose include lists exact file paths boots and resyncs on an edit to one of them

Evidence: `src/lib/watch/match.ts` (`staticPrefix`). An include entry with no glob, such as `theme/base.ts`, is a
valid pattern: the one-shot sync compiles the file it names. The watch read the whole path as its static head, so it
took the file for a directory: the symlinked-directory scan ran `theme/base.ts/**` and failed the boot with
`ENOTDIR: not a directory, scandir`, and the file itself would have been the subscription root. The last segment of a
pattern names files, never a directory, so the head now stops before it and the watch subscribes `theme`. The world's
`ui.config.ts` lists `theme/base.ts` and `theme/tokens.ts` exactly. The spec syncs, starts `watchSync()`, then edits
`theme/base.ts`: the sheet must resync to the new class. Before the fix `watchSync()` throws at boot.

> Search terms: exact file include, literal include path, non-glob include, ENOTDIR, scandir, not a directory, watch boot, staticPrefix, deriveWatchRoots, CORE-WATCH-31
