//! `container` dialect utility, matching core's box-pattern container transform.
//! Boolean or empty values only stamp `containerType: inline-size`.
//! A non-empty string also stamps `containerName` so named container queries can target it.

use crate::atom::{AtomValue, Want};

/// Emitted prop for the type stamp, emitted first.
pub(crate) const TYPE_PROP: &str = "containerType";
/// Emitted prop for the name stamp, emitted second.
pub(crate) const NAME_PROP: &str = "containerName";
/// Type value every `container` form stamps.
pub(crate) const INLINE_SIZE: &str = "inline-size";
/// Rendered value that stamps the type alone, like empty and `true`.
pub(crate) const BARE_VALUE: &str = "true";

/// Expand `container` into container-query setup longhands.
pub fn lower(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    // container  /  container={true}  /  container="sidebar"
    let mut out = vec![(TYPE_PROP.into(), AtomValue::String(INLINE_SIZE.into()))];
    let val = want.value.class_name_str();
    if !val.is_empty() && val != BARE_VALUE {
        // container="sidebar" → containerName: sidebar
        out.push((NAME_PROP.into(), AtomValue::String(val.into())));
    }
    out
}
