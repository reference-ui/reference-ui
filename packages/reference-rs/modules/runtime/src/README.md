# Runtime native host

Rust side of the Node-API addon. `lib.rs` links the product-level bindings behind a capability handshake and exposes a minimal host ping, delegating product ABI execution to the modules. The two counters modules exist only for the `counters-trace` instrument build: `counters_abi` snapshots rootless Mach/rusage words (instructions, cycles, faults, syscalls, per-thread CPU), and `counters_trace` dumps the before/after pair as one JSON report on drop when `COUNTERS_TRACE_OUT` names a file, so the shipped binary never pays for snapshots.
