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

use std::cmp::Ordering;

/// Bytewise ASCII case-insensitive ordering of a lowercase table probe
/// against a raw input, without allocating: folds input bytes on the fly,
/// exactly the order `input.to_ascii_lowercase()` byte-compares in, so
/// `binary_search_by` over a lowercase-sorted table decides identically.
pub(crate) fn cmp_lower_probe(probe: &str, input: &str) -> Ordering {
    let mut probe_bytes = probe.bytes();
    let mut input_bytes = input.bytes();
    loop {
        match (probe_bytes.next(), input_bytes.next()) {
            (Some(left), Some(right)) => {
                let ord = left.cmp(&right.to_ascii_lowercase());
                if ord != Ordering::Equal {
                    return ord;
                }
            }
            (None, Some(_)) => return Ordering::Less,
            (Some(_), None) => return Ordering::Greater,
            (None, None) => return Ordering::Equal,
        }
    }
}
