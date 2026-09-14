# Styletrace Tests

Rust tests are split by concern so resolver failures and wrapper-analysis
failures stay easy to diagnose.

## Files

- `mod.rs` — test module wiring
- `fixtures.rs` — scratch directories and shared case-fixture lookup
- `prop_resolution.rs` — type-surface resolver coverage
- `tracing.rs` — wrapper-analysis coverage