# CORE-WATCH-30 — a watch whose include mixes an unrooted glob with a path outside the project root resyncs on an edit under that outside path

Evidence: the watch matcher (`deriveWatchRoots`). An unrooted positive pattern such as `**/*.tsx` made the
watch roots the project root alone, so a rooted prefix that points outside it (a shared prefix outside the root) was dropped and never
subscribed. The world's `ui.config` includes both. The spec writes a shared colors file beside the world, syncs,
starts `watchSync()`, then edits that outside file: the sheet must resync to the new class. Before the fix the edit
goes unseen and the spec times out.

> Search terms: unrooted glob, outside project root, rooted prefix, watch roots, deriveWatchRoots, shared beside root, outside-root include, CORE-WATCH-30
