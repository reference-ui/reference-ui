# Shared Rust test fixtures

Fixtures every compiler-crate test builds on. `workspace.rs` is the RAII scratch directory (process id, clock stamp, and sequence number keep parallel tests apart, cleanup on drop); `base_system.rs` serves in-memory versioned system specs with indexed token leaves; `contracts.rs` embeds the frozen wire fixtures and asserts they deserialize in Rust and fail closed on bad versions or fields.
