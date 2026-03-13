# paths release readiness

## Verdict

Release-ready for internal use.

## Why

These helpers are small, but they sit on critical resolution paths for config,
workers, packaging, and generated output. A path bug here can break the whole
toolchain in a way that is hard to diagnose, so they needed direct tests before
earning a release-ready label.

That direct coverage now exists for:

- config candidate order (`ts` / `js` / `mjs`)
- `outDir` and `outDir/virtual` path derivation
- direct package-root discovery
- legacy `@reference-ui/cli` fallback behavior
- workspace fallback in `resolveCorePackageDir()`
- workspace preference in `resolveCorePackageDirForBuild()`
- dist path construction

## Remaining limits

- these are still internal helpers rather than hardened public APIs
- broader confidence still depends on the higher-level modules that consume them

## Practical judgment

For their actual role inside `reference-core`, these path helpers are now solid
enough to ship as part of Reference UI.
