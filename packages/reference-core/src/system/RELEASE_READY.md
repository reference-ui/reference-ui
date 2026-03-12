# system release readiness

## Verdict

Release-ready for internal use.

## Why

The `system` module is the heart of the generated-output pipeline.

It owns the steps that turn user config and fragment calls into:

- `panda.config.ts`
- `styled/styles.css` and Panda runtime output
- `system/baseSystem.mjs`
- generated type artifacts used by the packaged `system` and `react` outputs

That means a regression here can still look like "sync ran" while producing
broken config, incomplete runtime CSS, malformed `baseSystem`, or stale final
artifacts.

## Direct coverage now in place

There is now direct `reference-core` proof for the contracts that were
previously the biggest gap:

- direct tests cover system API helpers like `tokens`, `font`, `keyframes`, and
  `patterns`
- direct tests cover Panda config extension helpers
- direct tests cover the layer CSS transform logic
- direct tests cover generated font-registry output
- direct tests cover `createBaseArtifacts()` writing `baseSystem.mjs`
- direct tests cover `createBaseArtifacts()` writing `baseSystem.d.mts`
- direct tests cover `baseSystem` carrying the configured `name`
- direct tests cover `updateBaseSystemCss()` attaching CSS without corrupting the
  existing artifact
- direct tests cover deterministic reruns for base artifact creation
- direct tests cover base fragment preparation, aliasing, collector-bundle
  wiring, and portable fragment bundle ordering
- direct tests cover file-level layer postprocess behavior for missing CSS,
  local-only layers, and appended upstream layers
- direct tests cover `createLayerCss()` missing-file and file-read behavior
- direct tests cover `createPandaConfig()` rendering collector expressions,
  extensions import paths, and base-config overrides
- direct tests cover extensions bundle path helpers, bundle writes, and outDir
  mirroring
- direct tests cover the config run handler emitting `system:config:complete`
  for missing `cwd`, success, and failure
- direct tests cover the Panda run handlers emitting the expected completion
  events on success and logging the current failure path clearly

## What is already strong

There is also strong downstream confidence in the real pipeline:

- downstream app tests verify real sync artifacts under `.reference-ui`
- downstream app tests verify `layers` isolation behavior
- downstream app tests verify generated type augmentation
- downstream app tests verify interrupted-sync recovery
- downstream app tests verify stale outputs do not cause an early ready signal

The workspace release loop is also clear enough to be meaningful:

- `pnpm test:system` exercises the fast release gate across `reference-core` and
  `reference-app`

## Remaining limits

This verdict is for internal CLI infrastructure use, not for claiming that every
low-level edge is exhaustively hardened.

The main remaining limits are:

- malformed existing `baseSystem.mjs` JSON is still not exhaustively defended at
  every corruption edge
- the current config and Panda handler contracts intentionally favor pipeline
  progress by emitting completion signals even on failure, so broader integration
  coverage remains important
- some orchestration confidence still comes from downstream system tests rather
  than from a full in-core failure matrix
- deterministic reruns are now pinned for base artifacts, but not yet for every
  generated system artifact snapshot
- primitive-source generation is still covered more indirectly than directly
- the low-level Panda execution helper in `panda/gen/codegen.ts` still depends on
  broader integration coverage for filesystem and package-resolution behavior

## Practical judgment

This subsystem is now strong enough to ship as internal infrastructure inside
Reference UI.

The dangerous `baseSystem` artifact contract is no longer carried only by code
shape or downstream proof; `reference-core` now directly owns its creation,
types output, CSS attachment, and rerun stability. Combined with the existing
system suite, that is enough to treat `system` as release-ready for internal use.
