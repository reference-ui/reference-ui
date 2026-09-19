//! Harvest pass: the information layer (Forge Part I, Slice 4).
//!
//! The site walk asks *can I name this expression?* Harvest asks *is there a
//! complete CSS-shaped literal in this program?* `literals` collects the
//! pool — every wholesale string over the compile inputs — the walk records
//! a `Sink` at each refused dynamic value position through the one hook
//! (`ExpressionWalk::warn_dynamic`), and `mint` crosses the pool with the
//! kind-compatible sinks into the same wants vector the site walk filled.
//! Runtime looks the pairs up; a value the program never wrote never paints.

pub mod classify;
pub mod literals;
pub mod mint;
pub mod sinks;

pub use classify::classify_harvest_value;
pub use literals::{collect_pool, HarvestPool, KIND_ORDER};
pub use mint::{mint, MintCtx, HARVEST_ORIGIN};
pub use sinks::{is_sink_code, Sink, SinkSite};
