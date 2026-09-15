//! Font dialect utilities: `font` and `weight` as one subsystem, matching core's font transform.
//! Family tokens, weight tokens, and the font/weight expand live here. Other resolve folders do not know about font.
//! The table lives on `BaseSystem`. Generic CSS families have no lib tracking; letter-spacing arrives from the fixture.

mod family;
mod weight;

pub use family::lower_font;
pub use weight::lower_weight;

#[cfg(test)]
mod tests;
