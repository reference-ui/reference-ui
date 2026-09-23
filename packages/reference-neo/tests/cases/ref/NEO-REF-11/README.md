# NEO-REF-11 — tasty deprioritization proof

Proves the perf-law mechanism the medians alone cannot show: after a re-sync, `sync()` resolves while the
tasty manifest is still absent (sync-complete lands before tasty-manifest-ready), the background loop restores
the manifest afterwards, and the sync-owned folder is byte-identical across the re-sync (the `tasty/` subtree
is session-owned, excluded from the snapshot, and asserted separately by its absence-then-presence).

> Search terms: deprioritization, perf law, background loop, sync-complete, manifest-ready, byte-identical, NEO-REF-04

## Oracle mapping

Voyage map section 5 (mandatory): a case asserting sync output identical AND sync-complete before
tasty-manifest-ready. Numbered 11 because 10 is the lib re-commission, which is proven outside cases (lib
typecheck plus Book fixtures). The snapshot walker mirrors NEO-SYNC-06 minus the background-owned subtree.
