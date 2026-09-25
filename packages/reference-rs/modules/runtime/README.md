# Reference RS Runtime Host (`modules/runtime`)

The runtime module serves as the isolated Node-API host and distribution layer for `@reference-ui/rust`. It encapsulates dynamic native addon resolution, binary compilation, and Node runtime linking without embedding product-specific compiler or AST analysis logic.

## Architecture & Responsibilities

The host operates across two complementary boundaries:

1. **Native Dynamic Link Host (`cdylib`)**: Compiles the single native binary (`reference-native`) loaded by Node.js runtimes. Rather than authoring product entrypoints directly, the host crate links module ABIs via compile-time path declarations (`#[path]`) pointing to colocated `native.rs` files in `atlas`, `styletrace`, `system`, and `tasty`. The host itself only exposes a schema-versioned capability ping (`get_native_capabilities`).
2. **TypeScript Runtime Host (`js/`)**: Provides binary resolution across target triples, platform detection, and graceful fail-closed error diagnostics. When downstream consumers invoke native operations, the host validates binary compatibility and dispatches execution via generic JSON serialization helpers (`callNativeJson`) and typed native bindings.

## Module Boundaries

- **No Product Logic**: The host does not author AST transformations, component indexing, or stylesheet generation. Each product module owns its domain logic and ABI contract.
- **Zero Public Module Door**: The runtime host is an internal execution foundation and is not exposed as a public npm subpath.

> Search terms: loader, napi host, binary loader, runtime/loader, runtime/native-bindings, runtime/capabilities, rs:shared
