# CORE-SYNC-20 — extendSystem is a core call: a config that imports it from @reference-ui/system fails sync by name

The runner syncs this world fresh with a canonical config. That config imports only `defineConfig` from
`@reference-ui/core`. The spec then writes a config that imports `extendSystem` from `@reference-ui/system`,
calls it with a token override, and asserts that sync rejects with the import named.

`extendSystem` is a config call imported from `@reference-ui/core`. The system id has no such export. Were it
to keep one, a config reaching it there would get its base back unchanged, with no error, and the override
would vanish. The rejection keeps that mistake loud.

The misuse rides as a string the spec writes, because the package typecheck covers every world file: a world
that imported a missing export would turn the typecheck red for every case. The canonical config is restored
with a resync in a `finally`.

Siblings: CORE-LAYERS-18 (extendSystem's own misuse: unknown token, repeated entry, quoted name) and
CORE-SYNC-12 (the system id's authoring surface).

> Search terms: extendSystem, @reference-ui/system, @reference-ui/core, config, ui.config, override, theme,
> import, sync, named error, system entry, CORE-LAYERS-18, CORE-SYNC-12
