# reference-cli Completion Plan

Goal: finish `@reference-ui/cli` so it fully replaces `@reference-ui/core` as the system / CLI layer.

Not in scope:
- authored tokens, themes, colour scales, typography scales
- opinionated design-system content that belongs in `reference-lib` or another package
- preserving old `reference-core` architecture when the new CLI shape is cleaner

## Already done

- Worker-based sync pipeline with explicit `config` and `panda` workers
- `defineConfig` public API from `@reference-ui/cli`
- portable `baseSystem` generation owned by `system/base`
- `extends: [baseSystem]` end-to-end
- `reference-lib` exporting a generated base system
- `reference-app` dogfooding `extends` for tokens, globalCss, keyframes, and font
- Panda config generation separated from Panda execution
- generated package surfaces for `@reference-ui/system`, `@reference-ui/react`, and `@reference-ui/styled`

## Remaining replacement work

### 1. Primitives generation / migration

This is still the most obvious missing piece.

Current state:
- `@reference-ui/react` only exports `Div`
- `src/system/primitives/` is still a scaffold

Need:
- bring over the primitive generation/build step from `reference-core`
- populate the primitive set (`Div`, text/heading primitives, etc.)
- keep config-time vs runtime boundaries clean
- make sure generated / packaged react output points at the new CLI-owned styled/system outputs

Definition of done:
- `reference-cli` owns primitive generation
- `@reference-ui/react` exposes the expected runtime primitive surface without depending on `reference-core`

### 2. `layers: []`

`extends` is working; `layers` is the next composition mode to complete.

Need:
- append upstream `layers[].css` into the consumer output stylesheet
- keep `layers` fully out of Panda config merging and TS token generation
- verify CSS isolation through named layers
- add the runtime `layer` prop on primitives so `[data-layer="<name>"]` scoping works

Definition of done:
- a consumer can use `layers: [baseSystem]`
- components render correctly
- upstream tokens do not appear in the consumer Panda config or TS types
- primitives can scope tokens with `layer="<name>"`

### 3. Styled-system API parity

The new CLI covers the core base APIs we just dogfooded, but it does not yet cover the full old extension surface.

Likely missing public APIs:
- `recipe`
- `slotRecipe`
- `utilities`
- possibly `staticCss`
- possibly `globalFontface` as a first-class exported API

Need:
- decide the final public API surface for `@reference-ui/system`
- implement any missing fragment collectors / config integration
- keep one naming scheme and one export surface only

Definition of done:
- `entry/system.ts` is the single authoritative public system API
- there is no important authoring capability left in `reference-core` that is still required for system composition

### 4. Box pattern / custom props parity

This is the messy part from `reference-core`, but it is probably the last meaningful functional gap after primitives and layers.

Need to decide:
- how much of old box-pattern extensibility we still want
- whether custom props should come through a generated box pattern, fixed pattern, utilities, or a hybrid

Likely areas:
- rhythm props
- container props
- font / weight props through the final pattern system
- any old box behavior still required by primitives/runtime APIs

Definition of done:
- the new CLI supports the custom prop behavior we still care about
- no important runtime styling capability still requires `reference-core`

### 5. Final replacement pass

After the feature work above:
- update docs so `reference-cli` is clearly the primary system package
- audit any remaining `reference-core` references in app/lib/docs authoring flows
- confirm `reference-app` and `reference-lib` can serve as the new dogfood bed
- make sure tests cover the intended replacement surface, not old implementation details

## Probably obsolete from reference-core

These should not be treated as required parity if the CLI already solves the problem more cleanly:

- old isolated subsystem pipelines for font/baseSystem/panda
- internal vs system API duplication
- bootstrap-stub / monkey-patch style workarounds
- any design content that belongs in `reference-lib` rather than the CLI

## Recommended implementation order

1. Finish primitives generation / migration
2. Finish `layers: []` and the primitive `layer` prop
3. Close styled-system API parity gaps (`recipe`, `slotRecipe`, `utilities`, etc.)
4. Revisit box pattern / custom props parity
5. Do a final `reference-core` replacement audit and doc cleanup

## Success criteria

`reference-core` should no longer be needed for:
- authoring config
- building / syncing a system
- composing systems via `extends` or `layers`
- generating / packaging the runtime system
- exposing the system / react package surfaces

At that point, `reference-core` becomes historical reference only, while `reference-cli` is the real system platform.
