# paths release readiness

## Verdict

Not release-ready yet.

## Why

These helpers are small, but they sit on critical resolution paths for config,
workers, packaging, and generated output. A path bug here can break the whole
toolchain in a way that is hard to diagnose.

## Missing confidence

- no direct tests for config candidate order (`ts` / `js` / `mjs`)
- no direct tests for custom `outDir` resolution
- no direct tests for workspace fallback in `resolveCorePackageDir()`
- no direct tests for legacy `@reference-ui/cli` fallback behavior
- no direct tests for `resolveCorePackageDirForBuild()` choosing workspace
  sources over `node_modules`
- no direct tests for dist path construction

## Practical judgment

The functions are simple enough to trust during iteration, but they do not yet
meet a release bar that treats path resolution as a product contract.
