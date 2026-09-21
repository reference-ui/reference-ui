//! The 148 CSS named colors plus `transparent` and `currentcolor`.
//!
//! Seeded from reference-core's `CSS_COLOR_KEYWORDS` set; this table is now the
//! source of truth and the TS set is a future consumer. Entries are lowercase and
//! lexicographically sorted for binary search; lookup folds case during the
//! search without allocating, so `Red` and `RED` match. The five CSS-wide
//! keywords that shared the TS set
//! (`inherit`, `initial`, `revert`, `revert-layer`, `unset`) live in
//! `classify.rs` instead: they are keywords, not colors.

/// Every CSS named color plus `transparent` and `currentcolor`, sorted.
pub const NAMED_COLORS: &[&str] = &[
    "aliceblue",
    "antiquewhite",
    "aqua",
    "aquamarine",
    "azure",
    "beige",
    "bisque",
    "black",
    "blanchedalmond",
    "blue",
    "blueviolet",
    "brown",
    "burlywood",
    "cadetblue",
    "chartreuse",
    "chocolate",
    "coral",
    "cornflowerblue",
    "cornsilk",
    "crimson",
    "currentcolor",
    "cyan",
    "darkblue",
    "darkcyan",
    "darkgoldenrod",
    "darkgray",
    "darkgreen",
    "darkgrey",
    "darkkhaki",
    "darkmagenta",
    "darkolivegreen",
    "darkorange",
    "darkorchid",
    "darkred",
    "darksalmon",
    "darkseagreen",
    "darkslateblue",
    "darkslategray",
    "darkslategrey",
    "darkturquoise",
    "darkviolet",
    "deeppink",
    "deepskyblue",
    "dimgray",
    "dimgrey",
    "dodgerblue",
    "firebrick",
    "floralwhite",
    "forestgreen",
    "fuchsia",
    "gainsboro",
    "ghostwhite",
    "gold",
    "goldenrod",
    "gray",
    "green",
    "greenyellow",
    "grey",
    "honeydew",
    "hotpink",
    "indianred",
    "indigo",
    "ivory",
    "khaki",
    "lavender",
    "lavenderblush",
    "lawngreen",
    "lemonchiffon",
    "lightblue",
    "lightcoral",
    "lightcyan",
    "lightgoldenrodyellow",
    "lightgray",
    "lightgreen",
    "lightgrey",
    "lightpink",
    "lightsalmon",
    "lightseagreen",
    "lightskyblue",
    "lightslategray",
    "lightslategrey",
    "lightsteelblue",
    "lightyellow",
    "lime",
    "limegreen",
    "linen",
    "magenta",
    "maroon",
    "mediumaquamarine",
    "mediumblue",
    "mediumorchid",
    "mediumpurple",
    "mediumseagreen",
    "mediumslateblue",
    "mediumspringgreen",
    "mediumturquoise",
    "mediumvioletred",
    "midnightblue",
    "mintcream",
    "mistyrose",
    "moccasin",
    "navajowhite",
    "navy",
    "oldlace",
    "olive",
    "olivedrab",
    "orange",
    "orangered",
    "orchid",
    "palegoldenrod",
    "palegreen",
    "paleturquoise",
    "palevioletred",
    "papayawhip",
    "peachpuff",
    "peru",
    "pink",
    "plum",
    "powderblue",
    "purple",
    "rebeccapurple",
    "red",
    "rosybrown",
    "royalblue",
    "saddlebrown",
    "salmon",
    "sandybrown",
    "seagreen",
    "seashell",
    "sienna",
    "silver",
    "skyblue",
    "slateblue",
    "slategray",
    "slategrey",
    "snow",
    "springgreen",
    "steelblue",
    "tan",
    "teal",
    "thistle",
    "tomato",
    "transparent",
    "turquoise",
    "violet",
    "wheat",
    "white",
    "whitesmoke",
    "yellow",
    "yellowgreen",
];

/// True when `value` is a CSS named color, case-insensitively.
pub fn is_named_color(value: &str) -> bool {
    NAMED_COLORS
        .binary_search_by(|probe| super::cmp_lower_probe(probe, value))
        .is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn table_holds_148_named_colors_plus_two_specials() {
        assert_eq!(NAMED_COLORS.len(), 150);
    }

    #[test]
    fn table_is_sorted_for_binary_search() {
        let mut sorted = NAMED_COLORS.to_vec();
        sorted.sort_unstable();
        assert_eq!(sorted, NAMED_COLORS);
    }

    #[test]
    fn lookup_is_case_insensitive() {
        assert!(is_named_color("red"));
        assert!(is_named_color("RebeccaPurple"));
        assert!(is_named_color("TRANSPARENT"));
        assert!(is_named_color("currentColor"));
    }

    #[test]
    fn every_member_matches_in_any_ascii_case() {
        for color in NAMED_COLORS {
            assert!(is_named_color(color), "{color}");
            assert!(is_named_color(&color.to_ascii_uppercase()), "{color}");
        }
    }

    #[test]
    fn keywords_and_tokens_are_not_colors() {
        assert!(!is_named_color("inherit"));
        assert!(!is_named_color("sm"));
        assert!(!is_named_color("gray.800"));
        assert!(!is_named_color("red.500"));
        assert!(!is_named_color(""));
    }
}
