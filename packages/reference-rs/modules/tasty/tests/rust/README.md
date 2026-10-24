# Tasty Rust integration tests

One test binary per process-wide claim. `gate_once.rs` pins one nesting-gate run per file for a scan with an external declaration package, and one TST-W-PARSE-ERROR for a refused file. It holds the only `gate_runs` reader in its process so the counter has no concurrent caller.
