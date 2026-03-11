# system release readiness

## Verdict

Not yet release-ready.

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

## What is already strong

There is real confidence in the feature behavior:

- direct tests cover system API helpers like `tokens`, `font`, `keyframes`, and
  `patterns`
- direct tests cover Panda config extension helpers
- direct tests cover the layer CSS transform logic
- direct tests cover generated font-registry output
- downstream app tests verify real sync artifacts under `.reference-ui`
- downstream app tests verify `layers` isolation behavior
- downstream app tests verify generated type augmentation
- downstream app tests verify interrupted-sync recovery
- downstream app tests verify stale outputs do not cause an early ready signal

The workspace release loop is also clear enough to be meaningful:

- `pnpm test:system` exercises the fast release gate across `reference-core` and
  `reference-app`

## What is still missing

By the standards in `TEST_RELEASE_PLAN.md`, the remaining gap is still direct
ownership of the most dangerous system contracts.

In particular, I did not find direct `reference-core` tests that pin down:

- `system/base/create.ts` writing `baseSystem.mjs` with the expected `name`
- `system/base/create.ts` writing `baseSystem.d.mts`
- `updateBaseSystemCss()` attaching CSS without corrupting the existing artifact
- deterministic rerun behavior for base artifact creation
- malformed or partial `baseSystem.mjs` handling
- worker-level failure propagation for config and Panda phases
- "failed upstream phase does not silently unlock downstream work" inside
  `reference-core` itself

Those are exactly the kinds of contracts that should not rely only on downstream
proof.

## Practical judgment

This subsystem is in good shape for active internal development.

The feature set is real, the downstream behavior is strong, and the main system
suite now exercises important recovery and stale-output cases. But the module
still falls short of a clean release-ready verdict because its most central
artifact contract, `baseSystem`, is not yet directly tested at the level it
deserves, and worker-failure behavior is still only partially pinned down.

## What would change the verdict

I would be comfortable flipping this to release-ready once `reference-core`
itself directly proves:

- `baseSystem` creation and CSS attachment
- deterministic reruns for those artifacts
- at least one stable failure-path contract for config/Panda worker orchestration

That would move this area from "behavior looks strong downstream" to "the core
module owns its own critical contracts."
