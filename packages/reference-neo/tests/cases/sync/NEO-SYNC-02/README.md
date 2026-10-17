# NEO-SYNC-02 — generated folder matches the §4.1 inventory

The runner syncs this world fresh, then the spec walks `.reference-ui/`
node-side: every §4.1 expected path exists, every §4.1 forbidden
path is absent, and no panda needle survives anywhere in the folder. Package
files also parse as JSON, so a half-written folder reads as a failure, and the
three project `node_modules` links exist per the inventory.

Two §4.1 lines are knowingly unpinned, not silently skipped. `styled/css.mjs`
is still written until SYNC-13 moves the bound runtime into react, so
this spec asserts nothing about it either way and the SYNC-13 slice flips no
assertion here. The `tmp/` dir itself may exist empty until the fragments
evaluator drops its mkdir root, so this spec asserts `tmp/` carries no files
whether the dir exists or not. The remaining expected files land with their
own rows: `system.mjs` with SYNC-12, `compile-request.json` with SYNC-04,
`runtime-data.d.mts` with a publish follow-up, and `styled/types/*` with
TYPE. `react.mjs` / `react.d.mts` / `styles.css` came with SYNC-05, and
this spec pins the post-names (flipped in the migration follow-up).


> Search terms: manifest, allowlist, blocklist, symlink, folder census, census check, sync/folder-inventory, sync/forbidden-paths, NEO-SYNC-04, NEO-SYNC-05, NEO-SYNC-12, NEO-SYNC-13
