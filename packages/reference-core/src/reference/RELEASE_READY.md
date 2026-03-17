
# Reference

## Runtime Ownership

Tasty should own the low-level runtime contract.

Today, `reference` is carrying too much knowledge about generated artifact structure, chunk loading, manifest handling, and rebuild semantics. That works, but it means a higher-level feature package is acting as the integration layer for a lower-level IR system.

## First Step

Start with the broadest stroke first: separate the runtime boundary more clearly.

The most sensible first move is to introduce `createTastyBrowserRuntime(...)` inside Tasty and make that the main browser-facing entrypoint for loading emitted Tasty artifacts.

Why this first:

- It moves low-level loading logic out of `reference` without needing to solve every downstream design question yet.
- It gives us one place to harden production loading behavior.
- It reduces the number of places that need to understand manifest paths, chunk imports, and runtime module shape.
- It creates a cleaner seam for future work, since we can review the remaining responsibilities after the runtime boundary is in the right package.

Recommended split after that first move:

- `tasty` owns artifact shape, manifest versioning, chunk import rules, runtime validation, symbol loading, and browser-safe loading helpers.
- `reference` owns presentation, higher-level composition, worker orchestration, and "load symbol X and render it" behavior.

That likely means introducing a first-class Tasty runtime surface, something like:

- `createBrowserTastyRuntime(...)`
- `createTastyApiFromManifest(...)`
- `loadTastyManifest(...)`
- `importTastyArtifact(...)`

The important part is not the exact name, but that `reference` should not need to understand generated file layout beyond "here is a runtime entry" or "here is a manifest URL/module".

## Production Path Hardening

This needs to be part of the first step, not a later cleanup.

We already saw production breakage around relative-path handling, which is a strong signal that the current boundary is too implicit. Right now, the system relies on a mix of:

- a placeholder import in `packages/reference-core/src/entry/types.ts`
- a postprocess rewrite to `./tasty/runtime.js` in `packages/reference-core/src/packager/postprocess/rewrite-types-runtime-import.ts`
- manifest-relative chunk resolution in `packages/reference-rs/js/tasty/index.ts`

That is workable, but fragile if any packaging step, base path, or emitted location changes.

For `createTastyBrowserRuntime(...)`, document and enforce these rules explicitly:

- The runtime entry must be a real literal import edge in the final packaged output so app bundlers can see and include it.
- Chunk resolution must be anchored to the runtime or manifest location, not to caller-relative assumptions.
- Relative paths should be normalized in one place only, inside the Tasty browser runtime.
- If the placeholder runtime import was not rewritten correctly, packaging should fail hard.
- If a manifest-relative chunk cannot be resolved in production, the runtime should throw a clear path-resolution error rather than a vague missing-module failure.

This is both a documentation issue and a hardening issue. The path contract should live in Tasty, be tested in Tasty, and be described as part of the public browser runtime behavior.

## Recommended Direction

Add a browser-oriented runtime inside Tasty.

Why:

- It gives Tasty a single place to define and test the emitted artifact contract.
- It reduces duplication if anything else besides `reference` wants to consume the IR later.
- It makes bundler assumptions explicit and testable where they belong.
- It lets `reference` become a thin consumer rather than a partial runtime host.

A good end state is:

- Rust/Tasty emitter generates `manifest.js`, chunks, and a small runtime entry.
- Tasty JS exposes the runtime adapter for browser usage.
- `reference` imports the Tasty runtime and renders data from it.

## Reliability

Yes, reliability can be increased quite a bit.

Highest-value improvements:

- Make duplicate symbol names a build error instead of allowing silent overwrite in `symbolsByName`.
- Detect emitted symbol id or chunk-name collisions during generation and fail closed.
- Enforce manifest version compatibility at runtime rather than only checking for key presence.
- Validate chunk/module shape more strictly before use.
- Clear failed promise cache entries so transient import failures can retry.
- Write generated artifacts atomically instead of deleting the output directory and rewriting in place.
- Make unresolved references explicit in the emitted model instead of allowing them to fail later during load.
- Fail packaging if the runtime import placeholder rewrite did not occur.

## Quick Wins

These are the fastest hardening wins before any larger Tasty runtime refactor:

1. Fail closed on duplicate symbol names, hash collisions, unresolved references, and placeholder rewrite failures.
2. Add explicit manifest version checks instead of only checking for the presence of top-level keys.
3. Tighten runtime validation for chunk modules so malformed exports fail early with good errors.
4. Make generated artifact writes atomic so readers never see a half-written runtime.
5. Clear rejected chunk-load and API-load promises from caches so transient failures can retry cleanly.

More detail:

- Duplicate names and id collisions should be rejected during emit time in `packages/reference-rs/src/tasty/generator/esm.rs`. Right now `emit_manifest_module()` inserts into `symbols_by_name` directly, and `build_symbol_export_names()` derives public ids from a short deterministic hash. That means ambiguous names or a hash collision can silently corrupt the manifest.
- Manifest validation should become a real compatibility gate in `packages/reference-rs/js/tasty/index.ts`. `extractManifest()` currently only checks that the object looks roughly right and `isRawTastyManifest()` only verifies the presence of `version`, `symbolsByName`, and `symbolsById`. The runtime should reject unsupported versions immediately and surface a clear "emitter/runtime mismatch" error.
- Chunk validation should also get stricter in `packages/reference-rs/js/tasty/index.ts`. `extractChunkSymbol()` currently accepts either `module[symbolId]` or `default`, then only checks a shallow object shape. We should validate the required symbol fields and emit a more diagnostic error when the chunk export contract is wrong.
- Generated artifact writes in `packages/reference-core/src/reference/runtime.ts` should stop doing "delete and rewrite in place". `writeEmittedArtifacts()` currently removes the whole output directory and recreates it. A temp directory plus rename would make rebuilds atomic and prevent readers from seeing partially written manifests or chunk trees.
- Retry behavior should improve in both `packages/reference-rs/js/tasty/index.ts` and `packages/reference-core/src/reference/component.tsx`. `loadChunk()` caches the promise for each chunk path, and `getReferenceApi()` caches the whole API promise. If either promise rejects once, the failure becomes sticky. Rejected entries should be removed from cache so transient import or rebuild races can recover.
- Packaging should fail hard if the generated runtime edge is missing. `packages/reference-core/src/entry/types.ts` still imports a placeholder specifier, so the postprocess step must guarantee that placeholder was rewritten to `./tasty/runtime.js`. If not, the build should error instead of quietly shipping a package that app bundlers cannot fully follow.

These should give a noticeable reliability bump without needing to redesign the full package boundary first.

## Suggested Ownership Rule

Use this rule going forward:

- If the code needs to know how Tasty artifacts are structured, it belongs in Tasty.
- If the code decides how to present or consume resolved symbols for the Reference UI, it belongs in `reference`.

By that rule, a `browserRuntime` in Tasty is the right direction.

## Near-Term Plan

Before release, the most practical sequence is:

1. Move browser/runtime loading helpers into Tasty so `reference` depends on a cleaner public API.
2. Add strict manifest and chunk validation with explicit version checks.
3. Add collision detection and duplicate-name handling in generation.
4. Make artifact writes atomic and failed imports retryable.
5. Add integration tests that verify the emitted runtime works through the package boundary in real bundlers.
