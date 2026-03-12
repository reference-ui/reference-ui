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
  only on success and `system:config:failed` on missing `cwd` or runConfig failure
- direct tests cover the Panda run handlers emitting `system:panda:codegen` only
  on success and `system:panda:codegen:failed` on codegen failure
- direct tests cover sync event wiring: config/panda failure emits `sync:failed`,
  and downstream phases run only after upstream success (fail-closed)
- direct tests cover `updateBaseSystemCss()` corruption edges: truncated JSON,
  trailing garbage, null/array/missing-fields payloads leave file untouched
- direct tests cover deterministic reruns for `panda.config.ts`, font-registry
  output, layer postprocess result, and primitive source
- direct tests cover the Panda codegen helper: missing cwd, missing
  `panda.config.ts`, correct API call order, and updateBaseSystemCss gating
- direct tests cover primitive-source generation: tag parsing, reserved names
  (Obj, Var), single-letter tags (A), malformed tags.ts, and emitted structure

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

## Hardening (fail-closed and artifact stability)

The following former limits have been addressed:

- **baseSystem.mjs corruption:** Safe parsing and shape validation; corrupted or
  malformed existing content leaves the file untouched (no throw, no rewrite).
  Table-driven tests cover truncated JSON, trailing garbage, null/array/missing
  fields, and optional trailing semicolon.
- **Config and Panda contracts:** Orchestration is fail-closed. Config and
  Panda emit success-only completion events; on failure they emit
  `system:config:failed` / `system:panda:codegen:failed`, and sync emits
  `sync:failed` and exits with code 1. Downstream phases (Panda, packager) run
  only after upstream success.
- **In-core failure matrix:** Direct tests cover sync event gating, config run
  success/failure signaling, Panda codegen success/failure signaling, and the
  codegen helper (missing cwd, missing panda.config.ts, API call order,
  updateBaseSystemCss gating).
- **Deterministic reruns:** Pinned for base artifacts, `panda.config.ts`,
  font-registry/types output, layer postprocess result, and primitive source.
- **Primitive-source generation:** Direct tests for tag parsing, reserved
  export names (Obj, Var), single-letter tags (A), malformed tags.ts, and
  emitted source structure.
- **Panda codegen helper:** Direct unit tests for `runPandaCodegen` and
  `runPandaCss` (cwd/config presence, Panda API usage, layer postprocess and
  baseSystem update); integration coverage remains for symlink and
  package-resolution behavior in real envs.

## Practical judgment

This subsystem is now strong enough to ship as internal infrastructure inside
Reference UI.

The dangerous `baseSystem` artifact contract is no longer carried only by code
shape or downstream proof; `reference-core` now directly owns its creation,
types output, CSS attachment, and rerun stability. Combined with the existing
system suite, that is enough to treat `system` as release-ready for internal use.
