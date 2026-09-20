//! Final-plan proof: expected keys joined against emitted keys.
//!
//! Proof runs after assembly hands over the final owned lookup-key set and
//! needs no AST borrow. Expected key present means success; absent means a
//! proven userspace warning; no exact expectation means compiler-channel at
//! most. Slice 4 wires the owned-key plumbing; the join semantics land here.

pub mod plans;
