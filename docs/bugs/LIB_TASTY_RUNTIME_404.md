# LIB_TASTY_RUNTIME_404 — packaged lib lazy-imports an unmaterialized `./tasty/runtime.js`

STATUS: OPEN — filed 2026-10-08 by the robustness voyage (WAVE4), pre-existing,
**not** repaired (needs a scope ruling).

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

## Evidence trail

- Robustness voyage WAVE4 crew report
  `.agents/missions/voyage-robustness/reports/WAVE4.micros.md` §"Out-of-scope
  finding".
- `dist/index.mjs` context @byte 888610; `materialize-runtime.mjs:13`;
  `.reference-ui/types/tasty/runtime.js` present, `dist/tasty/` absent.
