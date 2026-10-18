# CORE-LAYERS-12 — a consumer config using layers, strict, staticCss and logs typechecks against the generated ReferenceUIConfig

The generated `@reference-ui/system` entry carries the `ReferenceUIConfig` that a consumer's
`defineConfig` call is checked against. It declared only `name`, `include`, `extends`, `jsxElements`,
`normalizeCss` and `debug`, so a consumer writing `layers`, `strict`, `staticCss` or `logs` got TS2353.
The generated type now carries all four, typed as in `src/config/types.ts`.

The runner syncs the world for real. The spec then typechecks two consumers with `tsc --noEmit`, each in
a temp project whose `@reference-ui/system` path maps to the world's generated `system.d.mts`:

1. A consumer calls `defineConfig` with `name`, `include`, `extends`, `layers`, `strict`, `staticCss` and
   `logs`, and must typecheck green.
2. A control consumer passes a key the type does not declare, and must fail with TS2353 on that key. This
   keeps the green result honest: a wide `Record<string, unknown>` surface would pass the first consumer
   without checking anything.

Evidence: `src/system/base/sources.ts` (`systemTypesSource`, which writes the generated `system.d.mts`),
`src/config/types.ts` (the contract the generated fields mirror), `src/system/base/sources.test.ts` (the
pinned generated text). Siblings: CORE-PARITY-01 (the same temp-project typecheck pattern), CORE-TYPE-05
(the authoring calls typecheck against the generated entry).

> Search terms: ReferenceUIConfig, generated types, system.d.mts, defineConfig, TS2353, excess property, layers, strict, staticCss, logs, typecheck
