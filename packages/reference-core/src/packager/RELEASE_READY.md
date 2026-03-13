# packager release readiness

## Verdict

Release-ready for internal use.

## Why

This is one of the highest-leverage parts of `reference-core`: even correct
generated artifacts are not useful if packaging, linking, or completion
signaling are flaky.

That is why this area needed direct tests for its own contracts rather than
relying only on downstream proof. That direct coverage now exists across the
main runtime and declaration-packaging paths.

## Direct coverage now in place

The current tests verify:

- writing package contents into `outDir`
- creating `node_modules/@reference-ui/*` symlinks to those outputs
- rerunning install safely for the same package
- replacing the React layer-name placeholder with `config.name`
- leaving non-React package bundles untouched
- failing loudly when bundling fails before linking
- delegating bundled package entry output through the esbuild path
- copying runtime assets like `styles.css`
- writing `package.json` metadata for packaged outputs
- emitting `packager:complete`
- emitting `packager-ts:complete` only in the `skipTypescript` case
- propagating packaging failures clearly
- routing declaration-package installs and generated entry types into the
  expected output paths

## What looks good already

- the responsibility is narrow and easy to describe
- package definitions are centralized in `packages.ts`
- bundling vs installation is split cleanly
- the `@reference-ui/styled` case is modeled explicitly instead of being hidden
- the event contract is small and readable
- the internal README now describes the real package/output model

## Remaining limits

- the declaration-compilation internals are still tested one layer up through
  `installPackagesTs()` wiring rather than exhaustively at every lower-level
  compiler edge
- the symlink helper still depends on `symlink-dir` and real platform behavior,
  so cross-platform confidence should continue to come from broader integration
  coverage too
- deterministic packaged artifact snapshots would still be useful as additional
  hardening, especially in downstream app/system suites

## Practical judgment

For its role as internal packaging infrastructure inside Reference UI, this is
now strong enough to ship.

The dangerous contracts in this module are no longer just implied by code shape;
they are pinned down directly enough that a regression in install, linking,
placeholder replacement, event signaling, or declaration-package pathing should
be caught inside `reference-core` itself.
