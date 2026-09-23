# system/base

Owns the portable Reference UI `baseSystem` concept.

This module is responsible for:

1. Scanning user-facing system fragments (`tokens`, `font`, `globalCss`, `keyframes`, patterns)
2. Bundling those fragments into a portable `baseSystem.fragment`
3. Writing `outDir/system/baseSystem.mjs` and `baseSystem.d.mts`
4. Producing the collector bundle that `system/panda/config` uses to write `panda.config.ts`

`baseSystem` is a Reference UI composition artefact, not a Panda artefact.
Panda config generation consumes the prepared collector bundle from here, and
Panda codegen only reads the written `panda.config.ts`.
