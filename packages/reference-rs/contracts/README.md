# Contracts

Frozen wire shapes shared by every compiler boundary. `types.ts` is the single source of truth for `EvaluatedSystemSpec`, `NativeRuntimeArtifact`, `CompileResult`, `SystemStreams`, `PortableBaseSystem`, and `NativeCompileRequest` serialization; both the TypeScript consumers and the Rust crates deserialize against these exact shapes.

Committed JSON fixtures pin the wire format at `schemaVersion` 1 under the `reference-ui` profile, including negative fixtures (unsupported versions, unknown fields, negative layers) that must fail closed. The test suite asserts every fixture satisfies its interface, so any drift between the types and the bytes breaks here first.
