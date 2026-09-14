//! Native atomic CSS compiler for Reference UI.
//!
//! Design lives in the `README.md` next to each module. This crate is a
//! scaffold: the module graph compiles, behavior comes later.
//!
//! Pipeline: styletrace (who) → extract (wants) → atom / resolve / recipes
//! → stylesheet + runtime. See the crate-level README. Vendor map: `PANDA.md`.

pub mod atom;
pub mod config;
pub mod diagnostics;
pub mod extract;
pub mod recipes;
pub mod resolve;
pub mod runtime;
pub mod stylesheet;

/// Styletrace is the “who has StyleProps” front half. `extract/sites` will
/// call it. Linked now so the crate graph matches the README.
#[doc(hidden)]
pub use styletrace as __styletrace;
