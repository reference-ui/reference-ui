# CORE-SYNC-21 — a theme file that reads baseSystem from @reference-ui/system fails sync with the named message

The world's theme file reads `baseSystem` from `@reference-ui/system` while sync evaluates it. The system being
built has no published form yet, so the sync-time system barrel exports `baseSystem` as a value that throws on
any read. The runner does not sync this world, because it fails by design; the spec runs sync and asserts the
rejection carries the named message, which tells the author to import upstream systems in `ui.config`.

Before the barrel existed, the id resolved to core's root barrel, which had no `baseSystem`. The bundle then
failed with `No matching export in "src/index.ts"`, a message that names neither the mistake nor its fix.

The theme file typechecks: `@reference-ui/system` declares `baseSystem`, so the package typecheck stays green.
The spec also asserts that a failed sync leaves no `.reference-ui` folder behind.

> Search terms: baseSystem, theme file, @reference-ui/system, sync, bootstrap, import map, system barrel, read,
> named error, CORE-SYNC-19, CORE-SYNC-11
