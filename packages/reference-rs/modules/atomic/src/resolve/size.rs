//! `size` dialect utility, matching core's box-pattern size transform.
//! One authored value expands to equal `width` and `height`.
//! Rhythm and token substitution still run on those longhands after this expand.

use crate::atom::{AtomValue, Want};

/// Expand `size` into equal width and height atoms.
pub fn lower(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    // size="20px"  /  size="2r"
    vec![
        ("width".into(), want.value.clone()),
        ("height".into(), want.value.clone()),
    ]
}
