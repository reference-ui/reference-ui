//! `textGradient` dialect utility, matching Panda's gradient-text expansion.
//! One authored gradient value expands to the background-clip trio: the
//! value on `backgroundImage`, `text` on `webkitBackgroundClip`, and
//! `transparent` on `color`. Each longhand resolves refs after this expand.

use crate::atom::{AtomValue, Want};

/// Expand `textGradient` into the background-clip trio atoms.
pub fn lower(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    // textGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})'
    vec![
        ("backgroundImage".into(), want.value.clone()),
        (
            "webkitBackgroundClip".into(),
            AtomValue::String("text".into()),
        ),
        ("color".into(), AtomValue::String("transparent".into())),
    ]
}
