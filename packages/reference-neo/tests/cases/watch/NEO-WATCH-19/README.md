# NEO-WATCH-19 — a commit that fails partway puts back every live file it had replaced, so the generated folder is byte-identical to before the run

The spec builds a temp world, syncs it, and records every file under the generated folder. It then changes the brand
token and makes `styled/` read-only, so the commit replaces `react/` and `system/` files before it reaches a write it
cannot make. The failing sync must exit non-zero, and the folder must match the recorded snapshot byte for byte: the
commit journals each replaced file as a hard link and renames the links back on failure. The read-only mode is
restored in a `finally`, and the world is removed when the spec ends.

> Search terms: commit rollback, partial commit, last-good outputs, torn folder, chmod read-only, EACCES, backup hard link, NEO-WATCH-19
