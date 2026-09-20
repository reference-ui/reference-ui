//! Radius pair expansion copying one side value to both addressed corners.
//! Lowers the six side shorthands (`borderTopRadius`, …) that have no CSS
//! property of their own. Corner names come from canon longhands, never a
//! private table; rhythm and tokens still run on each corner after expand.

use crate::atom::AtomValue;

/// Expand one radius pair shorthand into its two corner longhands.
/// Real properties (`borderRadius`, `borderWidth`, …) never reach here.
pub fn expand_pair_shorthand(prop: &str, value: &AtomValue) -> Option<Vec<(Box<str>, AtomValue)>> {
    // borderTopRadius: '2r'  /  borderStartRadius: '2r'
    let canon_name = canon::resolve_canonical_prop(prop);
    if !is_radius_pair(canon_name) {
        return None;
    }
    let longhands = canon::native_longhands_for_prop(canon_name)?;
    if longhands.len() != 2 {
        return None;
    }
    Some(vec![
        (longhands[0].into(), value.clone()),
        (longhands[1].into(), value.clone()),
    ])
}

/// True for the six side-radius shorthands that split into corner pairs.
pub(crate) fn is_radius_pair(canon_name: &str) -> bool {
    matches!(
        canon_name,
        "borderTopRadius"
            | "borderRightRadius"
            | "borderBottomRadius"
            | "borderLeftRadius"
            | "borderStartRadius"
            | "borderEndRadius"
    )
}
