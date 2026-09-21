//! Unit tests for the atomic crate, grouped by compiler seam under test.
//! Each module pins one contract with hermetic scratch trees plus the live
//! reference-lib sync root as a canary. Scratch workspaces clean up on drop;
//! canary tests return early when the gitignored sync output is absent.

mod gates;
mod seed;
mod stream;
mod surface;
