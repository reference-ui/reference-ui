# Atlas Rust integration tests

One test binary per process-wide claim. `gate_once.rs` pins one nesting-gate run per file for an analysis with observe specs, and holds the only `gate_runs` reader in its process so the counter has no concurrent caller.
