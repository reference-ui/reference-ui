//! Phase adapters: typed facts at each producer boundary.
//!
//! Each family converts its own outcomes into [`DiagnosticFact`] values so
//! prose and audience decisions live in policy, not in phase code. Sink
//! creation and compilation behavior stay exactly where they are today.
//! Slice 3 migrates one family at a time: extract, harvest, resolve, hosts.

pub mod extract;
pub mod harvest;
pub mod hosts;
pub mod resolve;
