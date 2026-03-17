
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

Implemented hardening:

- Duplicate symbol names are preserved instead of silently overwriting each other in the manifest.
- Duplicate-name lookups now warn and require explicit disambiguation instead of pretending a bare name is always unique.
- Emitted symbol id collisions now fail closed during generation.
- Manifest version compatibility is enforced at runtime.
- Browser-safe loading is separated from the Node/build-side manifest-path loader.
- Failed runtime initialization and chunk-load promises can retry instead of staying permanently rejected.
- The Tasty build path now owns emitted artifact writing rather than `reference` open-coding it.

Remaining sharp edges:

- Tasty still does not expose a first-class diagnostics/warnings channel beyond what is packed into the manifest and logged during build. We can build and load a partial graph, but still have limited structured visibility into what degraded during lowering.
- Reference resolution is still incomplete for some import forms and symbol shapes, especially default imports, namespace imports, and more complex cross-module reference patterns. Those cases can still degrade into unresolved or weaker references.
- There is still an `unsafe` AST-layout cast in the lowering path for tuple elements. That is a parser-coupling risk and should eventually be removed.
- Artifact writing is better, but not yet a true atomic directory swap. The flow still removes the old output directory before renaming the new one into place, so there is a brief gap where readers could observe missing outputs.
- Packaging still relies on the placeholder-runtime rewrite step. The runtime boundary is cleaner now, but the package edge should still fail hard if that rewrite ever does not happen.
- `reference` still owns the build-state/session cache keyed by source directory. That is okay for now, but config-sensitive invalidation is still something to keep an eye on as the build surface grows.

## Quick Wins

These are the fastest hardening wins before any larger Tasty runtime refactor:

1. Expose Tasty diagnostics and warnings as structured build output instead of only embedding them in the manifest and logging them.
2. Improve reference resolution for default imports, namespace imports, and other unresolved cross-module cases.
3. Replace the remaining `unsafe` tuple-element lowering cast with an explicit safe conversion path.
4. Finish the output-write hardening so the directory replacement is truly atomic.
5. Make the placeholder runtime rewrite step fail the package build if it does not happen.

More detail:

- Duplicate names are now preserved and warned on, while emitted-id collisions are rejected during emit time in `packages/reference-rs/src/tasty/generator/esm.rs`. That removes the silent-overwrite behavior while still treating a generated export-name collision as a Tasty integrity failure.
- Manifest validation in `packages/reference-rs/js/tasty/index.ts` is now a real compatibility gate, but the next step is to make more of the lowering/build diagnostics explicit to callers rather than only surfacing them through manifest warnings and logs.
- Runtime validation in `packages/reference-rs/js/tasty/index.ts` is tighter now, but the bigger remaining gap is unresolved or degraded references produced upstream by incomplete lowering/resolution.
- Generated artifact writes moved into the Tasty build layer, but the replacement flow should still be tightened so the directory swap is fully atomic rather than "remove old, then rename new".
- Retry behavior is improved now, so the next reliability step is less about retries and more about making build diagnostics and ambiguous symbol cases easier to consume upstream.
- Packaging still needs a stricter guard around the runtime placeholder rewrite. The generated package should fail loudly if the final literal `./tasty/runtime.js` edge is missing.

These should give a noticeable reliability bump without needing to redesign the full package boundary first.

## Suggested Ownership Rule

Use this rule going forward:

- If the code needs to know how Tasty artifacts are structured, it belongs in Tasty.
- If the code decides how to present or consume resolved symbols for the Reference UI, it belongs in `reference`.

By that rule, a `browserRuntime` in Tasty is the right direction.

## Near-Term Plan

Before release, the most practical sequence is:

1. Move browser/runtime loading helpers into Tasty so `reference` depends on a cleaner public API.
2. Expose structured diagnostics/warnings from the Tasty build side so Reference can reason about degraded output more cleanly.
3. Improve import/reference resolution for the unresolved cases we still know about.
4. Make artifact writes fully atomic and lock down the packaging rewrite failure mode.
5. Add integration tests that verify the emitted runtime works through the package boundary in real bundlers.
