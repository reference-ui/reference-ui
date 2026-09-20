//! Final-plan proof: expected keys joined against emitted keys.
//!
//! Proof runs after assembly hands over the final owned lookup-key set and
//! needs no AST borrow. Expected key present means success; absent means a
//! proven userspace warning; no exact expectation means compiler-channel at
//! most. Plans serialize through the one owned key type; session rendering
//! rewrites the pushed diagnostics in place from the join verdicts.

pub mod lines;
pub mod plans;
pub mod rejects;
pub mod render;
pub mod sinks;
