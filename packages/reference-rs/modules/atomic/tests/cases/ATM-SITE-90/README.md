# ATM-SITE-90 — A virtual source is never a traced host, so a compile past the lane threshold gets the same hosts and diagnostics as a small one

`Card` and `Badge` arrive as virtual sources: their bytes come from the request,
not from disk. `Card`'s props type comes from `types`, which does not parse,
and `Badge`'s props are an inline literal. A style trace walks only files on
disk and never resolves an import to a virtual file, so neither wrapper becomes
a traced host. The spec compiles the three virtual files alone, a small compile
below the 64-styling-file front threshold, and again with 70 filler sources
added, past that threshold. Both return no traced hosts and the same
diagnostics. `types` reports its own parse failure once.
Contract: SPEC. Siblings: ATM-SITE-89 (on-disk trace
failure warns once), ATM-SITE-13 (missing host graph).

> Search terms: virtual source, lane threshold, traced host, serial, parallel, on_disk_source, fold_trace
