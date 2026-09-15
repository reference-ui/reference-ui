//! `r` dialect utility: numeric and named keys become `@container (min-width: Npx)`.
//! Matches core's `r` box-pattern transform. Pixel widths come from `config/breakpoints.rs`.
//! Named container (`@container card (min-width: ...)`) is the same language when a name is present.

mod query;

pub use query::{lower_r_key, lower_r_key_named};

#[cfg(test)]
mod tests;
