# Runtime

The isolated Node-API host and distribution layer for `@reference-ui/rust`.
It links, loads, and ships the native addon. It owns no product logic.

## What it is

1. **Native host (crate `reference-native`)** — the sole `cdylib`
   compiling to `.node`. Links each product module's colocated `native`
   (atlas, atomic, styletrace, tasty, typegen) via compile-time `#[path]`
   includes; the host itself only exposes the schema-versioned capability
   ping (`get_native_capabilities`). The `alloc-trace` / `counters-trace`
   instrument builds never ship.
2. **JS host** — resolves the platform `.node` binary across target
   triples (`loader`), dispatches calls over generic JSON bridging
   (`native` bridge), and fails closed with a loud message when the binary is
   missing or stale. `REFERENCE_UI_NATIVE_PATH` overrides the candidate so
   instrument builds load without touching the build output.
3. **Pack tooling** — target-triple maps, the
   composed native-exports contract, content hashing over exactly the files
   cargo reads, freshness stamps beside every shipped binary, and
   publish / stage / verify gates, so a pack can never silently ship a
   prebuilt compiled from older sources.

## Boundaries

- No AST, component, or stylesheet logic: each product module owns its
  domain and ABI contract.
- Internal foundation, not a public npm subpath.

## Verify

```bash
pnpm agentrs v runtime
```

> Up: @reference-ui/rust

> Search terms: loader, napi host, binary loader, runtime/loader, runtime/native-bindings, runtime/capabilities, rs:shared
