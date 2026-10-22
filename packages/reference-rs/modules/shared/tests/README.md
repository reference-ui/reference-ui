# Integration tests

Integration tests for the shared crate. Cargo builds each file in this folder as its own test binary, so each one runs in a
process of its own. That matters for the nesting gate's run counter, `gate_runs`: it counts every gate run in a process, and the
unit tests in `src/parse/tests` run the gate on parallel threads. The one test here that compares exact counter deltas therefore
runs alone, and the unit tests pin what a screened source carries instead.
