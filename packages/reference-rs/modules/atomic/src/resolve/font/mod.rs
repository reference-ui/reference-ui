//! Font dialect utilities: `font` and `weight` as one subsystem, matching core's font transform.
//! Family tokens, weight tokens, and the font/weight expand live here. Other resolve folders do not know about font.
//! Ingest stays in `config/fonts.rs`. Defaults are CSS-generic; letter-spacing tracking is a fragment, not a compiler preset.

mod family;
mod weight;

pub use family::lower_font;
pub use weight::lower_weight;

#[cfg(test)]
mod tests;
