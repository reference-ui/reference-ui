# CORE-SYNC — generated folder and contracts

Proves that after `sync()` the `.reference-ui/` tree matches PLAN §4.1 exactly (expected present, forbidden absent), byte-deterministic, with loud config and compile errors — and every consumer specifier resolves. This group owns the folder; every other group's worlds sync through it. `SPEC.md` carries the folder contract; `TESTS.md` is the case ledger.

> Search terms: generated folder, sync inventory, byte-deterministic, compile request, baseSystem, authoring surface, watch resync, stale cleanup, extends merge

## Cases

- CORE-SYNC-01 — sync skeleton plus Rust handshake.
- CORE-SYNC-02 — generated folder matches the §4.1 inventory.
- CORE-SYNC-03 — baseSystem.mjs is the singular BaseSystem.
- CORE-SYNC-04 — compile-request.json equals the frozen NativeCompileRequest sent to the engine.
- CORE-SYNC-05 — consumer specifiers resolve to the generated entries.
- CORE-SYNC-06 — two consecutive syncs produce byte-identical folders.
- CORE-SYNC-07 — stale files from a previous sync are removed.
- CORE-SYNC-08 — config errors are loud and named.
- CORE-SYNC-09 — include globs scope scanning: a css() outside include yields no utility.
- CORE-SYNC-10 — extends adopts upstream tokens, recipes resolve, jsxElements merge, later fragment wins.
- CORE-SYNC-11 — a compile diagnostic fails sync with file and line, and no folder is half-written.
- CORE-SYNC-12 — @reference-ui/system exports the authoring surface.
- CORE-SYNC-13 — styled is data-only: css()/recipe() come from react bound to the owner.
- CORE-SYNC-14 — watch resyncs on change and deletion.
- CORE-SYNC-15 — zero-config `Card` traces into `local` and `<Card p="1r">` paints.
- CORE-SYNC-16 — `logs: ['compiler']` threads the opt-in through sync into the warning summary and the verbose compiler list.
- CORE-SYNC-17 — extends strips upstream _private at merge; own _private still paints.
- CORE-LAYER-04 — `normalizeCss: true` (default) opens with the reset layer; `false` omits it. Lives here: the remainder rung is SYNC-owned.
- CORE-TOKEN-10 — the `font()` registry emits `--fonts-*` and `--font-weights-*` and the `font: 'sans'` macro paints family + weight. Lives here: the remainder rung is SYNC-owned.

Parent: [tests/cases/](../README.md).
