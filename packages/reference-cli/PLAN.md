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
- CLI-owned primitives generation under `system/build/primitives`
- `@reference-ui/react` exposing the expected primitive runtime surface instead of just `Div`
- primitive runtime wrappers using stable `ref-<tag>` class hooks, keeping design content in `reference-lib`
- final public API surface for `@reference-ui/system` / `entry/system.ts` is settled

## Remaining replacement work

### 1. `layers: []`

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

### 2. Final replacement pass

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

1. Finish `layers: []` and the primitive `layer` prop
2. Do a final `reference-core` replacement audit and doc cleanup

## Success criteria

`reference-core` should no longer be needed for:
- authoring config
- building / syncing a system
- composing systems via `extends` or `layers`
- generating / packaging the runtime system
- exposing the system / react package surfaces

At that point, `reference-core` becomes historical reference only, while `reference-cli` is the real system platform.
