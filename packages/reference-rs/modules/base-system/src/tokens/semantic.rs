//! Frozen non-palette tokens: `design.*`, `text.*`, radii, animations, and font stacks.
//! `design` and `text` live under `colors` because that is how lib `tokens()` nested them.
//! Radii, animations, and fonts keep their own categories. Font family stacks come from
//! `fonts.rs` so the font table and token dictionary share one source.

use super::{fill_pairs, TokenDictionary, TokenLeaf};
use crate::fonts::FontScale;

const DESIGN: &[(&str, &str, &str)] = &[
    ("design.background", "oklch(100% 0 0)", "{colors.gray.950}"),
    ("design.foreground", "{colors.gray.950}", "{colors.gray.50}"),
    (
        "design.primary.background",
        "{colors.gray.950}",
        "{colors.gray.100}",
    ),
    (
        "design.primary.foreground",
        "{colors.gray.50}",
        "{colors.gray.950}",
    ),
    (
        "design.primary.hover.background",
        "{colors.gray.900}",
        "{colors.gray.50}",
    ),
    (
        "design.accent.foreground",
        "{colors.blue.600}",
        "{colors.blue.300}",
    ),
    (
        "design.accent.background",
        "{colors.gray.100}",
        "{colors.gray.950}",
    ),
    (
        "design.accent.hover",
        "{colors.blue.800}",
        "{colors.blue.300}",
    ),
    (
        "design.accent.border",
        "{colors.gray.300}",
        "{colors.blue.950}",
    ),
    ("design.text.base", "{colors.gray.950}", "{colors.gray.50}"),
    (
        "design.text.light",
        "{colors.gray.700}",
        "{colors.gray.300}",
    ),
    (
        "design.text.lighter",
        "{colors.gray.600}",
        "{colors.gray.400}",
    ),
    (
        "design.mark.background",
        "{colors.blue.200}",
        "{colors.blue.950}",
    ),
    (
        "design.mark.foreground",
        "{colors.blue.950}",
        "{colors.blue.200}",
    ),
];

const TEXT: &[(&str, &str, &str)] = &[
    ("text.primary", "{colors.gray.900}", "{colors.gray.50}"),
    ("text.secondary", "{colors.gray.700}", "{colors.gray.300}"),
    ("text.disabled", "{colors.gray.500}", "{colors.gray.500}"),
    ("text.accent", "{colors.red.700}", "{colors.red.800}"),
    ("text.highlight", "{colors.red.700}", "{colors.amber.300}"),
];

const RADII: &[(&str, &str, &str)] = &[
    ("sm", "0.27rem", "0.27rem"),
    ("md", "0.4rem", "0.4rem"),
    ("lg", "0.6rem", "0.6rem"),
    ("full", "9999px", "9999px"),
];

const ANIMATIONS: &[(&str, &str, &str)] = &[
    (
        "spin.slow",
        "spin 4s linear infinite",
        "spin 4s linear infinite",
    ),
    (
        "spin.normal",
        "spin 2s linear infinite",
        "spin 2s linear infinite",
    ),
    (
        "spin.fast",
        "spin 1s linear infinite",
        "spin 1s linear infinite",
    ),
    (
        "fadeIn.quick",
        "fadeIn 0.2s ease-out",
        "fadeIn 0.2s ease-out",
    ),
    (
        "fadeIn.normal",
        "fadeIn 0.5s ease-out",
        "fadeIn 0.5s ease-out",
    ),
    ("fadeIn.slow", "fadeIn 1s ease-out", "fadeIn 1s ease-out"),
    (
        "fadeOut.quick",
        "fadeOut 0.2s ease-out",
        "fadeOut 0.2s ease-out",
    ),
    (
        "fadeOut.normal",
        "fadeOut 0.5s ease-out",
        "fadeOut 0.5s ease-out",
    ),
    (
        "slideUp.quick",
        "slideUp 0.3s ease-out",
        "slideUp 0.3s ease-out",
    ),
    (
        "slideUp.normal",
        "slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    ),
    (
        "slideDown.quick",
        "slideDown 0.3s ease-out",
        "slideDown 0.3s ease-out",
    ),
    (
        "slideDown.normal",
        "slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    ),
    (
        "scaleIn.quick",
        "scaleIn 0.2s ease-out",
        "scaleIn 0.2s ease-out",
    ),
    (
        "scaleIn.normal",
        "scaleIn 0.3s ease-out",
        "scaleIn 0.3s ease-out",
    ),
    (
        "pulse.slow",
        "pulse 2s ease-in-out infinite",
        "pulse 2s ease-in-out infinite",
    ),
    (
        "pulse.normal",
        "pulse 1s ease-in-out infinite",
        "pulse 1s ease-in-out infinite",
    ),
    (
        "pulse.fast",
        "pulse 0.5s ease-in-out infinite",
        "pulse 0.5s ease-in-out infinite",
    ),
    (
        "bounce.normal",
        "bounce 1s ease-in-out infinite",
        "bounce 1s ease-in-out infinite",
    ),
    (
        "bounce.fast",
        "bounce 0.5s ease-in-out infinite",
        "bounce 0.5s ease-in-out infinite",
    ),
    (
        "ping.normal",
        "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
    ),
    (
        "ping.fast",
        "ping 0.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping 0.5s cubic-bezier(0, 0, 0.2, 1) infinite",
    ),
];

/// Insert design, text, radii, and animation tokens. Font stacks are filled separately.
pub fn fill(dict: &mut TokenDictionary) {
    fill_pairs(dict, "colors", DESIGN);
    fill_pairs(dict, "colors", TEXT);
    fill_pairs(dict, "radii", RADII);
    fill_pairs(dict, "animations", ANIMATIONS);
}

/// Copy each font family's stack into `fonts.{name}` so token lookup matches `font()`.
pub fn fill_fonts(dict: &mut TokenDictionary, fonts: &FontScale) {
    for (name, def) in fonts.iter() {
        dict.insert_leaf(TokenLeaf {
            category: "fonts",
            path: name,
            light: &def.value,
            dark: &def.value,
        });
    }
}
