# LIB_TASTY_RUNTIME_404 — packaged lib lazy-imports an unmaterialized `./tasty/runtime.js`

STATUS: FIXING — WAVE5 (combined materialize + analyzable), per Oracle
`CONCLUSION.oracle` CONC-P2-1. Filed 2026-10-08 by the robustness voyage
(WAVE4); prior to WAVE5 it was pre-existing and unrepaired.

## Symptom

`packages/reference-lib/scripts/consumer-smoke/run.mjs` reaches the final
Playwright **mount** probe and fails `zero-unexpected-console-errors` on a
**404 for `./tasty/runtime.js`**. Every earlier smoke step (`check:dist`,
`npm pack`, scaffold+install, step 3b fragment shape, `tsc`, `vite build`) and
every mount pass; only the lazy chunk 404s.

## Cause

`dist/index.mjs` (the built lib bundle) contains:

```js
createTastyBrowserRuntime({
  loadRuntimeModule: () => import(__rewriteRelativeImportExtension("./tasty/runtime.js")),
  …
})
```

resolved relative to `dist/index.mjs` → **`dist/tasty/runtime.js`**.
`packages/reference-lib/scripts/materialize-runtime.mjs:13` copies only
`react` + `styled` (`const runtimePackages = ['react', 'styled']`), so
`dist/tasty/` is never created. The tasty browser runtime is emitted by the
sync's tasty build at `.reference-ui/types/tasty/runtime.js` and never
materialized into `dist/`.

The same `./tasty/runtime.js` specifier is defined for the **types** package in
`packages/reference-neo/src/packager/packages.ts:12`
(`TYPES_RUNTIME_JS = './tasty/runtime.js'`); there the sync's dumb-bundle leg is
responsible for landing `types/tasty/` (the REF-10 drain,
`reference/bridge/init.ts:49-58`). The lib dist has no equivalent materialize
step for the tasty runtime.

## Why it was hidden

Consumer-smoke **step 1** (`check:dist`) previously aborted on the B-11
procedure FAIL (stale dist), so the mount probe never ran. Once WAVE4 resolved
the procedure with a fresh lib build, the smoke advanced far enough to surface
the 404.

## Scope / impact

Pre-existing; **not** introduced by the robustness voyage (`materialize-runtime`
is unchanged). Impact: a consumer that actually mounts the lib's reference
runtime (the `Reference` / tasty-browser path) would 404 the lazy chunk. This is
a **packaging-completeness** gap, distinct from the voyage's emit-determinism
scope.

## Fix options (for the Oracle to rule)

1. **Materialize the tasty runtime** into `dist/` — add the tasty output to
   `materialize-runtime.mjs` (`runtimePackages`/rewrites) so `dist/tasty/`
   lands, mirroring the react/styled treatment.
2. **Guard/gate the lazy import** so a lib-only consumer that never uses the
   reference runtime does not 404 (placeholder → optional / feature-detect).
3. **Declare the smoke mount probe over-strict** — if no real consumer takes
   that path, relax the assertion instead of shipping the chunk.

## Additional symptoms (docs dev server, 2026-10-08)

The same seam produces daily developer noise beyond the packaged 404:

1. **Vite cannot analyze the dynamic import.** `pnpm dev:docs` logs, on
   `packages/reference-lib/dist/index.mjs`:

   ```
   The above dynamic import cannot be analyzed by Vite.
   ... __rewriteRelativeImportExtension("./tasty/runtime.js") ...
   Plugin: vite:import-analysis
   ```

   Author: `packages/reference-neo/src/reference/browser/Runtime.ts:235`
   (`loadRuntimeModule: () => import('__REFERENCE_UI_TYPES_RUNTIME__' as string)`),
   rewritten to `./tasty/runtime.js`; the lib build (tsup/esbuild) then wraps it
   in the internal helper `__rewriteRelativeImportExtension` (3 references in
   `dist/index.mjs`). Every consumer bundler (Vite/rollup) warns.

2. **esbuild helper leak.** `dist/index.mjs` ships the internal
   `__rewriteRelativeImportExtension` function body — an implementation detail
   that should not appear in published output.

3. **Transient `Failed to load url … dist/index.mjs … Does the file exist?`
   spam** when a lib rebuild runs while the docs dev server is up: the lib build
   removes/rewrites `dist/` non-atomically, so the dev server's import of
   `dist/index.mjs`/`dist/theme/index.mjs` briefly 404s (then recovers). Not
   fatal, but it looks broken.

**Implication for the fix:** options 1/2 below should also make the emitted edge
statically analyzable (or materialize the file so it resolves) and avoid leaking
the helper; and the lib build should write `dist/` atomically (temp + rename) so
a live dev server never sees a half-written/missing entry.

## Evidence trail

- Robustness voyage WAVE4 crew report
  `.agents/missions/voyage-robustness/reports/WAVE4.micros.md` §"Out-of-scope
  finding".
- `dist/index.mjs` context @byte 888610; `materialize-runtime.mjs:13`;
  `.reference-ui/types/tasty/runtime.js` present, `dist/tasty/` absent.
