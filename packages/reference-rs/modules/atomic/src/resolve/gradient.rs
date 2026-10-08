//! `textGradient` dialect utility, matching Panda's gradient-text expansion.
//! One authored gradient value expands to the background-clip trio: the
//! value on `backgroundImage`, `text` on `webkitBackgroundClip`, and
//! `transparent` on `color`. Each longhand resolves refs after this expand.

use crate::atom::{AtomValue, Want};

/// Prop that carries the cloned gradient value.
pub(crate) const IMAGE_PROP: &str = "backgroundImage";
/// Clip prop and its literal value.
pub(crate) const CLIP_PROP: &str = "webkitBackgroundClip";
pub(crate) const CLIP_VALUE: &str = "text";
/// Ink prop and its literal value.
pub(crate) const INK_PROP: &str = "color";
pub(crate) const INK_VALUE: &str = "transparent";

/// Expand `textGradient` into the background-clip trio atoms.
pub fn lower(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    // textGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})'
    vec![
        (IMAGE_PROP.into(), want.value.clone()),
        (CLIP_PROP.into(), AtomValue::String(CLIP_VALUE.into())),
        (INK_PROP.into(), AtomValue::String(INK_VALUE.into())),
    ]
}
