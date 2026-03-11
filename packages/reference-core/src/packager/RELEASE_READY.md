# packager release readiness

## Verdict

Not yet release-ready.

## Why

The packager has a clean shape and an understandable responsibility, but by the
standards in `TEST_RELEASE_PLAN.md` it is still missing the direct proof needed
for a high-leverage output stage.

This subsystem is responsible for the final packaging contract that the rest of
the product depends on:

- writing package contents into `outDir`
- generating `package.json` metadata and export maps
- copying runtime assets like `styles.css`
- exposing those outputs through `node_modules/@reference-ui/*` symlinks
- coordinating completion signals with the TypeScript packaging phase

If this layer regresses, the product can appear "generated successfully" while
consumer imports still fail at runtime or build time. That makes it too central
to mark release-ready without direct tests.

## What looks good already

- the responsibility is narrow and easy to describe
- package definitions are centralized in `packages.ts`
- bundling vs installation is split cleanly
- the `@reference-ui/styled` case is modeled explicitly instead of being hidden
- the event contract is small and readable
- the internal README now describes the real package/output model

## What is still missing

I did not find direct test coverage for the core packager contracts themselves.
In particular, this area would benefit from explicit tests for:

- `installPackages()` writing packages into the expected `outDir`
- symlink creation into `node_modules/@reference-ui`
- package.json generation for bundled and non-bundled packages
- asset copying from generated output
- layer-name placeholder replacement in the React bundle
- `runBundle()` completion signaling, especially the `skipTypescript` branch
- failure behavior when bundling, copying, or symlink creation goes wrong

Without those tests, confidence in this module is mostly based on code shape and
indirect integration behavior rather than on pinned contracts.

## Practical judgment

This is close to being a release-ready internal subsystem, but not there yet.

The implementation is coherent enough that I would document and keep building on
it, but I would not use this file to claim packager is fully release-ready until
the output, symlink, and completion-event contracts are covered directly.
