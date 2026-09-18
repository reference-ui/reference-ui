# NEO-SYNC-14 — watch resyncs on change and deletion

Evidence: `[core]` watch behaviour (`packages/reference-core/src/watch/`
maps parcel `create/update/delete` to `add/change/unlink`, filters by
`ui.config.include`, and ignores `node_modules`, `.reference-ui`, `.git`,
and gitignored paths before matching).

The runner syncs this world fresh, then the spec starts `watchSync()`
node-side and edits live sources: adding `theme/extra.ts` resyncs its
utility into the sheet (add → discovery), rewriting `theme/uses.ts`
swaps one utility for another (change → alignment), and deleting both
files resyncs every utility away (unlink → deletion). Every resync
re-scans the include globs from disk, so all three nouns ride the same
serial sync. The spec restores the edited sources and resyncs in a
`finally`, so the world is byte-clean for the next run even when an
assertion fails.
