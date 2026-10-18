# NEO-WATCH-25 — a new file inside a symlinked directory target resyncs the class the link serves

The runner syncs this world fresh, then the spec makes `theme/linkdir` a symlink to `shared/empty`, a directory
outside include that is empty when the watch boots. Starting `watchSync()` must subscribe to the real target
directory, so a new file created inside it (`shared/empty/fresh.ts`) resyncs the sheet, and the change is reported
under the link's own path, `theme/linkdir/fresh.ts`. Before the fix nothing watched the empty target, so the new
file was never seen until a later matched event rescanned the tree. The link, the target and the world are restored
in a `finally`.

> Search terms: symlinked directory, directory symlink, symlink target directory, new file, empty target, real path subscription, link path mapping, resync, NEO-WATCH-04, NEO-WATCH-25
