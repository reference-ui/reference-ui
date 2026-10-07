# Oracle design consult — dropping tsup / unifying package builds (TSUP.oracle)

STEP: TSUP.oracle
PIN: HEAD on `reference-system` (see `git log --oneline -1`). Read
`.agents/missions/package-unify-1008/BRIEF.md` (owner instruction + recon) and
the bodies below; `FINALIZE.md` F-1.

## Context

The owner wants every Reference lib packaged the way `reference-icons` is
(rollup), modelled on `reference-neo`'s simplicity (a 148-line esbuild script) —
and `tsup` (unmaintained) stripped out with its dependency baggage. Today only
`reference-lib` uses `tsup@^8.5.1`; `reference-icons` uses
`rollup@^4.59` + `rollup-plugin-esbuild`; `reference-neo` uses `esbuild@^0.28`.

Files to read: `packages/reference-lib/{package.json,tsup.config.ts,tsconfig.build.json}`,
`packages/reference-lib/scripts/{build-package.mjs,materialize-runtime.mjs,check-dist-fresh.mjs,consumer-smoke/run.mjs}`,
`packages/reference-icons/{package.json,rollup.config.mjs,scripts/build.mjs}`,
`packages/reference-neo/tools/build-bin.mjs`.

Note: the WAVE5 work (in flight/landed, `docs/bugs/LIB_TASTY_RUNTIME_404.md`)
adds a `dist/tasty/` materialize + a `__rewriteRelativeImportExtension` strip in
the neo postprocess; the helper leak is a **tsc** artifact
(`rewriteRelativeImportExtensions`), not tsup's.

## Ask

1. **Target.** Which shape should `reference-lib` (and, going forward, every
   lib) adopt: rollup like icons, a small esbuild script like neo, or tsc-emit
   only? Justify against the actual `dist` contract (two entries `index` +
   `theme/index`, `format: esm`, `.mjs` extension, externals
   react/react-dom/@reference-ui/react+styled, `noExternal: gsap`, ~2.25 MB
   single-file bundle, `clean`).
2. **Exactly what tsup buys us today** that must be replaced: bundling of the
   large dependency graph, deps externalization, `gsap` inlining, the `.mjs`
   ext, `splitting:false`. What breaks if we just switch to `tsc` emit (many
   files) or rollup?
3. **Coupling.** `materialize-runtime.mjs` `bundleRewrites` (string rewrites of
   `@reference-ui/react` etc. inside the bundle), `build-package.mjs`
   (`NODE_URL_BRANCH_PATTERN` B-35 patch), `check-dist-fresh.mjs` (tsup-shaped
   staleness compare), the consumer smoke's packed-`dist` assertions. Which of
   these are tsup-shaped and must change, and which are bundle-shape-agnostic?
4. **The helper leak.** Does dropping tsup + shipping tsc emit make the
   `rewriteRelativeImportExtensions` helper *more* prominent (tsc emit kept) or
   does WAVE5's postprocess strip cover it either way? Recommend the interaction.
5. **Census.** `grep -rn "tsup"` across the workspace (excluding node_modules):
   who else (mcp? matrix? docs?) would the migration touch, and is a total
   removal in scope or is lib the only real user?
6. **Risk & perf.** Build wall time, docs spin-up, the matrix/hermetic runners,
   the dev server (`dist` shape), and reverting safety. What is the smallest
   first arc that de-risks the rest?
7. **Bar.** The acceptance for a migration arc (dist contract parity, consumer
   smoke green, docs build clean, perf not regressed, pins).

## Constraints

No performance regression (owner emphasis). One working tree — implementers
serialize. Do not propose touching the running docs dev server or the
`font-weight-runtime-1008` mission. This is an investigation first; landing is a
follow-on the owner will green-light.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
file:line, evidence, recommendation; a concrete migration plan (target shape,
ordered arcs, exact files); the bar; risks. P4 for non-repair observations.
