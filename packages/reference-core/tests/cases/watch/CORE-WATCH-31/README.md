# CORE-WATCH-31 — a watch whose include lists exact file paths boots and resyncs on an edit to one of them

Evidence: the watch matcher (`staticPrefix`). An include entry with no glob, such as the theme base fixture, is a
valid pattern: the one-shot sync compiles the file it names. The watch read the whole path as its static head, so it
took the file for a directory: the symlinked-directory scan ran a glob under the theme base file and failed the boot with
`ENOTDIR: not a directory, scandir`, and the file itself would have been the subscription root. The last segment of a
pattern names files, never a directory, so the head now stops before it and the watch subscribes `theme`. The world's
`ui.config` lists the theme base and theme tokens fixtures exactly. The spec syncs, starts `watchSync()`, then edits
the theme base fixture: the sheet must resync to the new class. Before the fix `watchSync()` throws at boot.

> Search terms: exact file include, literal include path, non-glob include, ENOTDIR, scandir, not a directory, watch boot, staticPrefix, deriveWatchRoots, CORE-WATCH-31
