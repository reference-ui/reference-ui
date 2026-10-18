# CORE-WATCH-02 — a watch started through a symlinked project root resyncs a new css() file

The runner syncs this world fresh, then the spec links the world under a temp
alias directory and starts `watchSync()` through that link. Parcel reports real
paths, so a watch whose root is the alias drops every event unless it matches on
the real root. A new `css()` file under `theme/` must still resync into the sheet,
and the spec proves it with the sheet and the watcher's own `add` report. The
alias is unlinked and the world restored in a `finally`, so the tree is
byte-clean for the next run.

> Search terms: symlink, symlinked project root, realpath, watch root, parcel real paths, TMPDIR symlink, /var/folders, dropped events, CORE-WATCH-02
