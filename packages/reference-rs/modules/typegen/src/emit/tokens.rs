//! Category-relative token unions plus the aggregate `Tokens` index.
//! Walks `tokens.iter()`, strips the spec category prefix so
//! `colors.brand.primary` becomes `brand.primary`, and emits sorted unique
//! string-literal unions. Core imported categories (`colors`, `spacing`,
//! `radii`) always emit named aliases, printing `never` when empty.
//! Non-core categories are omitted when unpopulated. The `tones` category is
//! known but never a `CATEGORIES` row: it prints `ToneToken` from the first
//! path segment of each entry (`medium.surface` → `medium`) plus the
//! `TonedColorToken` template alias that composes it onto `ColorToken`.

use super::ts::join_union;
use base_system::BaseSystem;
use std::collections::{BTreeMap, BTreeSet};

struct CategorySpec {
    category: &'static str,
    ts_type: &'static str,
}

/// Category whose values are tone roles, not printable token paths: names come
/// from the first path segment. Kept out of `CATEGORIES` on purpose.
const TONES_CATEGORY: &str = "tones";
const TONE_TOKEN: &str = "ToneToken";
const TONED_COLOR_ALIAS: &str = "export type TonedColorToken = `${ColorToken}/${ToneToken}`;\n";

/// Spec category names as `from_json` stores them, mapped to SPEC type aliases.
const CATEGORIES: &[CategorySpec] = &[
    CategorySpec {
        category: "colors",
        ts_type: "ColorToken",
    },
    CategorySpec {
        category: "spacing",
        ts_type: "SpacingToken",
    },
    CategorySpec {
        category: "radii",
        ts_type: "RadiusToken",
    },
    CategorySpec {
        category: "fontSizes",
        ts_type: "FontSizeToken",
    },
    CategorySpec {
        category: "fontWeights",
        ts_type: "FontWeightToken",
    },
    CategorySpec {
        category: "lineHeights",
        ts_type: "LineHeightToken",
    },
    CategorySpec {
        category: "shadows",
        ts_type: "ShadowToken",
    },
    CategorySpec {
        category: "zIndex",
        ts_type: "ZIndexToken",
    },
    CategorySpec {
        category: "animations",
        ts_type: "AnimationToken",
    },
];

pub(super) fn token_unions(system: &BaseSystem) -> String {
    let grouped = group_literals(system);
    let tones = group_tone_names(system);
    if grouped.is_empty() && tones.is_empty() && system.breakpoints().is_empty() {
        return String::new();
    }
    let mut out = String::new();
    let mut fields: Vec<(&'static str, &'static str)> = Vec::new();
    for spec in CATEGORIES {
        if push_category_alias(&mut out, spec, &grouped) {
            fields.push((spec.category, spec.ts_type));
        }
    }
    push_tone_aliases(&mut out, &tones);
    fields.push((TONES_CATEGORY, TONE_TOKEN));
    push_tokens_interface(&mut out, &fields);
    out
}

/// First path segments under `tones` (`medium.surface` → `medium`), sorted and
/// deduped. Grouping by hand keeps a `CATEGORIES` row from printing role leaves.
fn group_tone_names(system: &BaseSystem) -> BTreeSet<String> {
    let mut names = BTreeSet::new();
    for (key, entry) in system.tokens.iter() {
        if entry.category() != TONES_CATEGORY {
            continue;
        }
        let relative = relative_path(key, TONES_CATEGORY);
        names.insert(relative.split('.').next().unwrap_or(relative).to_string());
    }
    names
}

fn push_tone_aliases(out: &mut String, tones: &BTreeSet<String>) {
    if !out.is_empty() {
        out.push('\n');
    }
    push_alias(out, TONE_TOKEN, tones);
    out.push('\n');
    out.push_str(TONED_COLOR_ALIAS);
}

fn push_category_alias(
    out: &mut String,
    spec: &'static CategorySpec,
    grouped: &BTreeMap<&'static str, BTreeSet<String>>,
) -> bool {
    if let Some(lits) = grouped.get(spec.category) {
        if !out.is_empty() {
            out.push('\n');
        }
        push_alias(out, spec.ts_type, lits);
        true
    } else if is_core_category(spec.category) {
        if !out.is_empty() {
            out.push('\n');
        }
        push_never_alias(out, spec.ts_type);
        true
    } else {
        false
    }
}

fn is_core_category(category: &str) -> bool {
    matches!(category, "colors" | "spacing" | "radii")
}

fn push_never_alias(out: &mut String, name: &str) {
    out.push_str("export type ");
    out.push_str(name);
    out.push_str(" = never;\n");
}

fn group_literals(system: &BaseSystem) -> BTreeMap<&'static str, BTreeSet<String>> {
    let mut grouped: BTreeMap<&'static str, BTreeSet<String>> = BTreeMap::new();
    for (key, entry) in system.tokens.iter() {
        let Some(spec) = spec_for(entry.category()) else {
            continue;
        };
        grouped
            .entry(spec.category)
            .or_default()
            .insert(relative_path(key, spec.category).to_string());
    }
    grouped
}

fn spec_for(category: &str) -> Option<&'static CategorySpec> {
    CATEGORIES.iter().find(|spec| spec.category == category)
}

/// Category names the printer knows, for the diagnostics collector's suggestions.
/// Reads the spec table directly, so the printer and its suggestions can never drift.
pub(crate) fn known_token_categories() -> Vec<&'static str> {
    let mut names: Vec<&'static str> = CATEGORIES.iter().map(|spec| spec.category).collect();
    names.push(TONES_CATEGORY);
    names
}

/// Whether the printer knows a dump token category; unknown categories are
/// skipped by `group_literals` and reported by the diagnostics collector.
/// `tones` is known even though it is not a `CATEGORIES` row.
pub(crate) fn is_known_token_category(category: &str) -> bool {
    spec_for(category).is_some() || category == TONES_CATEGORY
}

fn relative_path<'a>(key: &'a str, category: &str) -> &'a str {
    key.strip_prefix(category)
        .and_then(|rest| rest.strip_prefix('.'))
        .unwrap_or(key)
}

fn push_alias(out: &mut String, name: &str, lits: &BTreeSet<String>) {
    out.push_str("export type ");
    out.push_str(name);
    out.push_str(" = ");
    out.push_str(&join_union(lits));
    out.push_str(";\n");
}

fn push_tokens_interface(out: &mut String, fields: &[(&'static str, &'static str)]) {
    if fields.is_empty() {
        return;
    }
    if !out.is_empty() {
        out.push('\n');
    }
    out.push_str("export interface Tokens {\n");
    for (category, ts_type) in fields {
        out.push_str("  ");
        out.push_str(category);
        out.push_str(": ");
        out.push_str(ts_type);
        out.push_str(";\n");
    }
    out.push_str("}\n");
}
