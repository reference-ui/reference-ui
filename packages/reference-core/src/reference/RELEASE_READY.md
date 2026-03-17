
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
- Tuple-element lowering now uses an explicit safe conversion path instead of relying on an `unsafe` AST-layout cast, but we should still keep an eye on its reparsing fallback behavior and coverage.
- Tasty output publication now writes into versioned directories and swaps the stable output path atomically, but we should still add coverage around first-run migration and package-boundary behavior.
- Packaging still relies on the placeholder-runtime rewrite step, but that edge is now enforced as a hard invariant so the package build fails loudly if the rewrite does not happen.
- Build/session caching now lives behind the Tasty build layer instead of `reference`, but config-sensitive invalidation is still something to keep an eye on as the build surface grows.

TODOs:


- Expose Tasty diagnostics and warnings as structured build output rather than only embedding them in the manifest and logging them.
- Add integration coverage for the atomic Tasty output publication path, especially around migration from legacy directories and package-boundary consumers.

## Quick Wins

These are the fastest hardening wins before any larger Tasty runtime refactor:

1. Expose Tasty diagnostics and warnings as structured build output instead of only embedding them in the manifest and logging them.
2. Improve reference resolution for default imports, namespace imports, and other unresolved cross-module cases.
3. Add package-boundary integration coverage that exercises the emitted runtime through real bundler flows.
4. Add explicit coverage for atomic Tasty publication and legacy-directory migration behavior.

More detail:

- Duplicate names are now preserved and warned on, while emitted-id collisions are rejected during emit time in `packages/reference-rs/src/tasty/generator/esm.rs`. That removes the silent-overwrite behavior while still treating a generated export-name collision as a Tasty integrity failure.
- Manifest validation in `packages/reference-rs/js/tasty/index.ts` is now a real compatibility gate, but the next step is to make more of the lowering/build diagnostics explicit to callers rather than only surfacing them through manifest warnings and logs.
- Runtime validation in `packages/reference-rs/js/tasty/index.ts` is tighter now, but the bigger remaining gap is unresolved or degraded references produced upstream by incomplete lowering/resolution.
- Generated artifact writes and session caching now live in the Tasty build layer, and the stable output path is now published via an atomic symlink swap onto versioned directories.
- Retry behavior is improved now, so the next reliability step is less about retries and more about making build diagnostics and ambiguous symbol cases easier to consume upstream.
- Packaging now fails loudly if the final literal `./tasty/runtime.js` edge is missing, so the next step there is broader package-boundary integration coverage rather than a softer postprocess warning.

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
