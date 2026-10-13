# NEO-WATCH-05 — an edit to a gitignored file that include matches resyncs its class

The runner syncs this world fresh, then the spec adds a `.gitignore` that ignores
`theme/gen/` and a `css()` file inside it. The engine walks the include globs without
reading `.gitignore`, so the baseline sheet carries the class. The watch must match
the engine: an edit to the gitignored file resyncs the sheet, where a watch that
honored `.gitignore` would drop it. The ignore file, the directory and the world are
restored in a `finally`.

> Search terms: gitignore, gitignored include, ignore policy, engine ignore set, stale sheet, NEO-WATCH-05
