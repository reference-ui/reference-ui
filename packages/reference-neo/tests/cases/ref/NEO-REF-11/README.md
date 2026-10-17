# NEO-REF-11 — tasty deprioritization proof

Proves the perf-law mechanism the medians alone cannot show. A re-sync preserves the tasty dir (commit
0e08d7cb9), so the manifest survives sync unless it is removed first. The case sets up the missing-manifest
path explicitly: it deletes the manifest, then `sync()` resolves while the manifest is still absent
(sync-complete lands before tasty-manifest-ready), the background loop restores it afterwards, and the
sync-owned folder is byte-identical across the re-sync (the `tasty/` subtree is session-owned, excluded from
the snapshot, and asserted separately by its absence-then-presence). A second leg re-syncs without deleting
and asserts the preserved manifest's bytes are unchanged across `sync`.

> Search terms: deprioritization, perf law, background loop, sync-complete, manifest-ready, byte-identical, NEO-REF-04

## Oracle mapping

Mandatory: a case asserting sync output identical AND sync-complete before
tasty-manifest-ready. Numbered 11 because 10 is the lib re-commission, which is proven outside cases (lib
typecheck plus Book fixtures). The snapshot walker mirrors NEO-SYNC-06 minus the background-owned subtree.
