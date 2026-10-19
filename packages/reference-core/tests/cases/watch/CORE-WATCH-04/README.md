# CORE-WATCH-04 — an edit to a symlink's target resyncs the class the link serves

The runner syncs this world fresh, then the spec creates a shared colors file outside
`theme/` and links the linked theme file to it. The baseline sync reads the link through
to its target. Starting `watchSync()` must watch the target's directory, so an edit
to the shared colors file resyncs the sheet and is reported under the link's own path in the linked file. The link, the shared file and the world are restored in a `finally`.

> Search terms: symlink target, linked source, symlinked file, link target edit, realpath target, map events back, CORE-WATCH-04
