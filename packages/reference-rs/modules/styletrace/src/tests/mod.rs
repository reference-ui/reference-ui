//! Contains the test suite for the styletrace crate, organized by internal concerns such as resolution and analysis.
//! It coordinates the execution of isolated unit and integration tests across the various modules.
//! Takes test assertions and simulated file environments via the fixtures module.
//! Emits test results, verifying the correctness of type expansion and JSX wrapper tracing.

mod fixtures;
mod hermetic_roots;
mod neo_decl_roots;
mod owned_props;
mod prop_resolution;
mod tracing;
