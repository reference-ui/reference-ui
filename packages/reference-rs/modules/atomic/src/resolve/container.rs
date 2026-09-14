//! `container` dialect utility, matching core's box-pattern container transform.
//! Boolean or empty values only stamp `containerType: inline-size`.
//! A non-empty string also stamps `containerName` so named container queries can target it.

use crate::atom::{AtomValue, Want};

/// Expand `container` into container-query setup longhands.
pub fn lower(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    // container  /  container={true}  /  container="sidebar"
    let mut out = vec![(
        "containerType".into(),
        AtomValue::String("inline-size".into()),
    )];
    let val = want.value.class_name_str();
    if !val.is_empty() && val != "true" {
        // container="sidebar" → containerName: sidebar
        out.push(("containerName".into(), AtomValue::String(val.into())));
    }
    out
}
