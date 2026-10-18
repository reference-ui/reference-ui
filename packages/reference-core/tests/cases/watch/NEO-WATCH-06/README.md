# NEO-WATCH-06 — an edit to a dotfile that include matches resyncs its class

The runner syncs this world fresh, then the spec adds `theme/.hidden.ts` with a
`css()` call. The engine's include walk is dot-enabled, so the baseline sheet carries
the class. The watch must match that: an edit to the dotfile resyncs the sheet, where
a non-dot matcher would drop it. The dotfile is removed and the world restored in a
`finally`.

> Search terms: dotfile, dot files, hidden file, picomatch dot, include dot entries, NEO-WATCH-06
