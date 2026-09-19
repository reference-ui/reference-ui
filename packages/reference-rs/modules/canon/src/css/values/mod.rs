//! CSS value alphabet: recognizers for complete CSS values in source.
//!
//! The alphabet answers one question — *is this string complete CSS?* — so the
//! token resolver (§9 fence) and the harvest pass (Slice 4) never mistake a
//! color, length, or function for a token path. Rhythm (`Nr`) stays atomic's;
//! everything here is pure CSS grammar over closed tables and balanced parens.

pub mod classify;
pub mod functions;
pub mod lengths;
pub mod named_colors;

pub use classify::{classify_css_value, prop_accepts, ValueKind};
pub use functions::classify_function;
pub use lengths::is_length;
pub use named_colors::is_named_color;
