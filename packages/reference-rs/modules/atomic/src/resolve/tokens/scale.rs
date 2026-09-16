//! Property-to-token-category mapping for bare scale lookups.
//!
//! Bare authored values (`4`, `md`, `card`) carry no category prefix, so the
//! property names the dictionary to search. Aliases canonicalise through canon
//! first; this table only pairs canonical properties with the dump categories
//! they accept. Mirror changes in `static_css` wildcard expansion, which answers
//! the same question for `staticCss` synthesis.

/// Token category a bare value on `prop` resolves against, if any.
pub fn token_category_for_prop(prop: &str) -> Option<&'static str> {
    let canonical = canon::resolve_canonical_prop(prop);
    shape_category(canonical)
        .or_else(|| surface_category(canonical))
        .or_else(|| motion_category(canonical))
        .or_else(|| type_category(canonical))
        .or_else(|| spacing_or_size_category(canonical))
}

/// Shape properties: radii, font families, animations.
fn shape_category(canonical: &str) -> Option<&'static str> {
    match canonical {
        "borderRadius" | "rounded" => Some("radii"),
        "fontFamily" | "ff" => Some("fonts"),
        "animation" | "animationName" => Some("animations"),
        _ => None,
    }
}

/// Surface properties: shadows, stacking, gradients.
fn surface_category(canonical: &str) -> Option<&'static str> {
    match canonical {
        "boxShadow" => Some("shadows"),
        "zIndex" => Some("zIndex"),
        "background" | "backgroundImage" => Some("gradients"),
        _ => None,
    }
}

/// Transition properties: easing curves and durations.
fn motion_category(canonical: &str) -> Option<&'static str> {
    match canonical {
        "transitionTimingFunction" => Some("easings"),
        "transitionDuration" => Some("durations"),
        _ => None,
    }
}

/// Typography scale properties: size, weight, leading, tracking.
fn type_category(canonical: &str) -> Option<&'static str> {
    match canonical {
        "fontSize" => Some("fontSizes"),
        "fontWeight" => Some("fontWeights"),
        "lineHeight" => Some("lineHeights"),
        "letterSpacing" => Some("letterSpacings"),
        _ => None,
    }
}

/// Box-model properties: spacing scale, then physical sizes.
fn spacing_or_size_category(canonical: &str) -> Option<&'static str> {
    if is_spacing_property(canonical) {
        Some("spacing")
    } else if is_size_property(canonical) {
        Some("sizes")
    } else {
        None
    }
}

fn is_spacing_property(prop: &str) -> bool {
    matches!(
        prop,
        "margin"
            | "marginTop"
            | "marginBottom"
            | "marginLeft"
            | "marginRight"
            | "marginInline"
            | "marginBlock"
            | "padding"
            | "paddingTop"
            | "paddingBottom"
            | "paddingLeft"
            | "paddingRight"
            | "paddingInline"
            | "paddingBlock"
            | "gap"
            | "rowGap"
            | "columnGap"
            | "inset"
            | "top"
            | "bottom"
            | "left"
            | "right"
    )
}

fn is_size_property(prop: &str) -> bool {
    matches!(
        prop,
        "width" | "height" | "minWidth" | "maxWidth" | "minHeight" | "maxHeight" | "size"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aliases_canonicalise_before_category_match() {
        assert_eq!(token_category_for_prop("rounded"), Some("radii"));
        assert_eq!(token_category_for_prop("ff"), Some("fonts"));
        assert_eq!(token_category_for_prop("mt"), Some("spacing"));
        assert_eq!(token_category_for_prop("p"), Some("spacing"));
    }

    #[test]
    fn each_breadth_category_has_a_property() {
        assert_eq!(token_category_for_prop("boxShadow"), Some("shadows"));
        assert_eq!(token_category_for_prop("width"), Some("sizes"));
        assert_eq!(token_category_for_prop("zIndex"), Some("zIndex"));
        assert_eq!(token_category_for_prop("transitionTimingFunction"), Some("easings"));
        assert_eq!(token_category_for_prop("transitionDuration"), Some("durations"));
        assert_eq!(token_category_for_prop("backgroundImage"), Some("gradients"));
    }

    #[test]
    fn unknown_properties_have_no_category() {
        assert_eq!(token_category_for_prop("display"), None);
        assert_eq!(token_category_for_prop("color"), None);
    }
}
