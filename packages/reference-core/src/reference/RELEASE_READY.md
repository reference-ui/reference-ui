
# Reference Release Plan

## Goal

This plan is for getting `reference` release-ready without piling on architecture changes for their own sake.

The current shape is broadly good:

- Tasty lowers and emits the artifact set.
- `reference` builds from the current project state and consumes those artifacts.
- The browser/runtime boundary is already cleaner than it was before.

From here, the work should stay centered on four things:

1. making sure the system is reliable
2. making sure code quality is good
3. making sure things are well tested
4. making sure `reference` has good separation of concerns and stays well written

## Working Rule

Do not redesign the system unless a concrete reliability, correctness, or maintainability problem demands it.

That means:

- prefer tightening contracts over introducing new layers
- prefer better tests over cleverer architecture
- prefer clearer ownership over broader abstractions
- prefer removing sharp edges over chasing idealized end states

## Current Position

The major hardening work already completed is meaningful:

- Duplicate symbol names are preserved instead of silently overwriting each other in the manifest.
- Duplicate-name lookups now warn and require explicit disambiguation instead of pretending a bare name is always unique.
- Emitted symbol id collisions now fail closed during generation.
- Manifest version compatibility is enforced at runtime.
- Browser-safe loading is separated from the Node/build-side manifest-path loader.
- Failed runtime initialization and chunk-load promises can retry instead of staying permanently rejected.
- The Tasty build path now owns emitted artifact writing rather than `reference` open-coding it.
- Tuple-element lowering now uses an explicit safe conversion path instead of relying on an `unsafe` AST-layout cast.
- Packaging now fails hard if the runtime placeholder rewrite does not happen.

This means the release plan does not need another big conceptual refactor first. The remaining work is about tightening the weak spots that still matter.

## Release Priorities

### Reliability

Highest priority reliability work:

- Expose Tasty diagnostics and warnings as structured build output rather than only embedding them in the manifest and logging them.
- Improve reference resolution for default imports, namespace imports, and other unresolved cross-module cases.
- Keep the current simple `tasty` output model, but make sure rebuild behavior is predictable and well covered.
- Keep the packaging/runtime boundary explicit and fail loudly when it is violated.

Remaining reliability risks:

- Reference resolution is still incomplete for some import forms and symbol shapes, especially default imports, namespace imports, and more complex cross-module reference patterns.
- Tasty still does not expose a first-class diagnostics/warnings channel beyond what is packed into the manifest and logged during build.
- Build/session caching now lives behind the Tasty build layer, but config-sensitive invalidation is still something to keep an eye on as the build surface grows.

### Code Quality

For release, code quality here means keeping the boundary understandable and the implementation boring in a good way.

The main code quality goals are:

- `reference` should orchestrate builds and consumption, not reimplement Tasty internals.
- Tasty-facing logic should live in Tasty when it depends on artifact shape or runtime contract details.
- `reference` code should stay small, explicit, and easy to follow rather than becoming an integration dumping ground.
- New hardening work should come with cleanup when it makes ownership or naming clearer.

### Testing

Testing should prove the system works in the ways it is actually consumed.

Highest-value test gaps:

- Integration coverage for the emitted runtime through the package boundary in realistic bundler/package flows.
- Coverage for the unresolved import/reference cases once they are fixed.
- Coverage for structured diagnostics/warnings once that output exists.
- Rebuild/cache behavior tests that prove changed inputs do not silently reuse stale state.

### Separation Of Concerns

The release concern here is not "invent more architecture." It is "keep responsibilities clean enough that the code stays dependable."

Use this rule:

- If code needs to understand emitted Tasty artifact structure, manifest rules, chunk loading, or runtime validation, it belongs in Tasty.
- If code decides how `reference` builds, orchestrates, selects symbols, or renders resolved information, it belongs in `reference`.

For `reference`, good separation of concerns means:

- the worker/build path stays focused on orchestration
- the component layer stays focused on presentation and symbol consumption
- packager logic stays focused on packaging
- docs reflect the real boundary instead of aspirational architecture

## Release Checklist

Before release, this is the practical sequence:

1. Expose structured diagnostics/warnings from the Tasty build side so degraded output is visible as a real contract, not just logs.
2. Fix the known import/reference resolution gaps, starting with default imports, namespace imports, and the most common cross-module failures.
3. Add package-boundary integration coverage so the emitted runtime path is tested the way consumers actually use it.
4. Add rebuild/cache coverage that exercises config-sensitive invalidation and protects against stale output reuse.
5. Do a final cleanup pass on `packages/reference-core/src/reference` so naming, ownership, and file responsibilities are clear and unsurprising.

## What Not To Do

Before release, avoid:

- adding new architectural layers without a specific failure mode driving them
- changing the output layout just to make it feel more abstract or more "correct"
- moving logic between Tasty and `reference` unless it clearly improves reliability or ownership
- treating documentation as a design pitch instead of a release-readiness checklist
